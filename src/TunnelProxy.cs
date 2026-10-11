using System;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;

namespace TunnelProxy
{
    class Program
    {
        private static int _listenPort = 5050;
        private static int _targetPort = 5000;

        static void Main(string[] args)
        {
            if (args.Length > 0) int.TryParse(args[0], out _listenPort);
            if (args.Length > 1) int.TryParse(args[1], out _targetPort);

            TcpListener listener = new TcpListener(IPAddress.IPv6Any, _listenPort);
            try { listener.Server.SetSocketOption(SocketOptionLevel.IPv6, SocketOptionName.IPv6Only, false); } catch { }
            try {
                listener.Start();
            } catch {
                listener = new TcpListener(IPAddress.Any, _listenPort);
                listener.Start();
            }
            Console.WriteLine(string.Format("TunnelProxy active: Listening on {0} -> Forwarding to 127.0.0.1:{1}", _listenPort, _targetPort));

            while (true)
            {
                try
                {
                    TcpClient client = listener.AcceptTcpClient();
                    Console.WriteLine("Incoming connection accepted from " + client.Client.RemoteEndPoint);
                    ThreadPool.QueueUserWorkItem(delegate(object state)
                    {
                        HandleClient((TcpClient)state);
                    }, client);
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Accept exception: " + ex.Message);
                }
            }
        }

        private static void HandleClient(TcpClient client)
        {
            TcpClient server = null;
            try
            {
                server = new TcpClient();
                server.Connect("127.0.0.1", _targetPort);

                NetworkStream clientStream = client.GetStream();
                NetworkStream serverStream = server.GetStream();

                // Read client headers
                byte[] headerBuffer = new byte[16384];
                int totalRead = 0;
                int headerEnd = -1;

                while (totalRead < headerBuffer.Length)
                {
                    int r = clientStream.Read(headerBuffer, totalRead, headerBuffer.Length - totalRead);
                    if (r <= 0) break;
                    int prevTotal = totalRead;
                    totalRead += r;

                    for (int i = Math.Max(0, prevTotal - 3); i <= totalRead - 4; i++)
                    {
                        if (headerBuffer[i] == 13 && headerBuffer[i + 1] == 10 &&
                            headerBuffer[i + 2] == 13 && headerBuffer[i + 3] == 10)
                        {
                            headerEnd = i + 4;
                            break;
                        }
                    }
                    if (headerEnd > 0) break;
                }

                if (headerEnd > 0)
                {
                    string headerText = Encoding.ASCII.GetString(headerBuffer, 0, headerEnd);
                    // Rewrite Host header to target
                    string rewrittenHeader = Regex.Replace(
                        headerText,
                        @"(?m)^Host:\s*[^\r\n]+",
                        "Host: localhost:" + _targetPort,
                        RegexOptions.IgnoreCase
                    );

                    // Ensure Connection: close for simplicity
                    if (Regex.IsMatch(rewrittenHeader, @"(?m)^Connection:\s*[^\r\n]+", RegexOptions.IgnoreCase))
                    {
                        rewrittenHeader = Regex.Replace(
                            rewrittenHeader,
                            @"(?m)^Connection:\s*[^\r\n]+",
                            "Connection: close",
                            RegexOptions.IgnoreCase
                        );
                    }
                    else
                    {
                        rewrittenHeader = rewrittenHeader.Replace("\r\n\r\n", "\r\nConnection: close\r\n\r\n");
                    }

                    byte[] newHeaderBytes = Encoding.ASCII.GetBytes(rewrittenHeader);
                    serverStream.Write(newHeaderBytes, 0, newHeaderBytes.Length);

                    // Check Content-Length for any body payload (e.g. POST / PUT)
                    Match clMatch = Regex.Match(headerText, @"(?m)^Content-Length:\s*(\d+)", RegexOptions.IgnoreCase);
                    int contentLength = 0;
                    if (clMatch.Success)
                    {
                        int.TryParse(clMatch.Groups[1].Value, out contentLength);
                    }

                    int excessBody = totalRead - headerEnd;
                    int bodyRemaining = contentLength;
                    if (excessBody > 0)
                    {
                        int toForward = Math.Min(excessBody, bodyRemaining);
                        serverStream.Write(headerBuffer, headerEnd, toForward);
                        bodyRemaining -= toForward;
                    }
                    if (bodyRemaining > 0)
                    {
                        byte[] bodyBuf = new byte[8192];
                        while (bodyRemaining > 0)
                        {
                            int toRead = Math.Min(bodyRemaining, bodyBuf.Length);
                            int br = clientStream.Read(bodyBuf, 0, toRead);
                            if (br <= 0) break;
                            serverStream.Write(bodyBuf, 0, br);
                            bodyRemaining -= br;
                        }
                    }

                    // Pump response from server back to client
                    byte[] respBuf = new byte[16384];
                    int respRead;
                    while ((respRead = serverStream.Read(respBuf, 0, respBuf.Length)) > 0)
                    {
                        clientStream.Write(respBuf, 0, respRead);
                    }
                }
            }
            catch { }
            finally
            {
                try { if (client != null) client.Close(); } catch { }
                try { if (server != null) server.Close(); } catch { }
            }
        }
    }
}
