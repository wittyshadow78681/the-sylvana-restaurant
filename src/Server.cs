using System;
using System.Collections.Generic;
using System.IO;
using System.Net;
using System.Text;
using System.Threading;
using System.Web.Script.Serialization;

namespace NexusFlow
{
    public class Server
    {
        private static readonly object _fileLock = new object();
        private static readonly Dictionary<string, UserSession> _activeSessions = new Dictionary<string, UserSession>();
        private static readonly JavaScriptSerializer _jsonSerializer = new JavaScriptSerializer { MaxJsonLength = int.MaxValue };
        private static readonly UTF8Encoding _utf8 = new UTF8Encoding(false);
        private static readonly DateTime _startTime = DateTime.UtcNow;
        private static long _requestCount = 0;

        private static string _baseDir;
        private static string _publicDir;
        private static string _dataDir;
        private static string _adminPassword = "admin123";
        private static string _adminUsername = "admin";

        public class UserSession
        {
            public string Token { get; set; }
            public string Username { get; set; }
            public DateTime CreatedAt { get; set; }
            public DateTime ExpiresAt { get; set; }
        }

        public class ContactMessage
        {
            public string id { get; set; }
            public string name { get; set; }
            public string email { get; set; }
            public string subject { get; set; }
            public string message { get; set; }
            public string timestamp { get; set; }
            public bool read { get; set; }
        }

        public class AuditLogEntry
        {
            public string id { get; set; }
            public string timestamp { get; set; }
            public string action { get; set; }
            public string user { get; set; }
            public string details { get; set; }
        }

        public static void Main(string[] args)
        {
            int port = 5000;
            if (args.Length > 0)
            {
                int customPort;
                if (int.TryParse(args[0], out customPort))
                {
                    port = customPort;
                }
            }

            // Resolve directories
            _baseDir = AppDomain.CurrentDomain.BaseDirectory;
            if (File.Exists(Path.Combine(_baseDir, "public", "index.html")))
            {
                // running from root
            }
            else if (File.Exists(Path.Combine(_baseDir, "..", "public", "index.html")))
            {
                _baseDir = Path.GetFullPath(Path.Combine(_baseDir, ".."));
            }

            _publicDir = Path.Combine(_baseDir, "public");
            _dataDir = Path.Combine(_baseDir, "data");

            if (!Directory.Exists(_publicDir)) Directory.CreateDirectory(_publicDir);
            if (!Directory.Exists(_dataDir)) Directory.CreateDirectory(_dataDir);

            // Seed default content if content.json does not exist
            string contentPath = Path.Combine(_dataDir, "content.json");
            string defaultPath = Path.Combine(_dataDir, "default_content.json");
            if (!File.Exists(contentPath) && File.Exists(defaultPath))
            {
                File.Copy(defaultPath, contentPath);
            }

            string urlPrefix = "http://localhost:" + port + "/";
            HttpListener listener = new HttpListener();
            listener.Prefixes.Add(urlPrefix);

            try
            {
                listener.Start();
                Console.WriteLine("==================================================");
                Console.WriteLine("   NexusFlow Web Server & Dynamic CMS Engine      ");
                Console.WriteLine("==================================================");
                Console.WriteLine("Server started successfully!");
                Console.WriteLine("Public Website:   " + urlPrefix);
                Console.WriteLine("Admin Dashboard:  " + urlPrefix + "admin");
                Console.WriteLine("API Root:         " + urlPrefix + "api/content");
                Console.WriteLine("Base Directory:   " + _baseDir);
                Console.WriteLine("Default Login:    Username: admin  |  Password: " + _adminPassword);
                Console.WriteLine("Press Ctrl+C to terminate the server.");
                Console.WriteLine("==================================================");
            }
            catch (Exception ex)
            {
                Console.WriteLine("FATAL ERROR: Failed to start HttpListener: " + ex.Message);
                return;
            }

            while (listener.IsListening)
            {
                try
                {
                    HttpListenerContext context = listener.GetContext();
                    ThreadPool.QueueUserWorkItem(delegate(object state)
                    {
                        try
                        {
                            HandleRequest((HttpListenerContext)state);
                        }
                        catch (Exception reqEx)
                        {
                            Console.WriteLine("Error processing request: " + reqEx.Message);
                        }
                    }, context);
                }
                catch (HttpListenerException)
                {
                    break;
                }
                catch (Exception ex)
                {
                    Console.WriteLine("Listener exception: " + ex.Message);
                }
            }
        }

        private static void HandleRequest(HttpListenerContext context)
        {
            Interlocked.Increment(ref _requestCount);
            HttpListenerRequest req = context.Request;
            HttpListenerResponse res = context.Response;
            res.KeepAlive = false;

            // CORS headers
            res.Headers["Access-Control-Allow-Origin"] = "*";
            res.Headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS";
            res.Headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Requested-With";

            if (req.HttpMethod == "OPTIONS")
            {
                res.StatusCode = 204;
                res.Close();
                return;
            }

            string path = req.Url.AbsolutePath;

            // Dispatch routes
            if (path.StartsWith("/api/"))
            {
                HandleApi(req, res, path);
            }
            else
            {
                HandleStatic(req, res, path);
            }
        }

        private static void HandleApi(HttpListenerRequest req, HttpListenerResponse res, string path)
        {
            try
            {
                if (path == "/api/health")
                {
                    Dictionary<string, object> health = new Dictionary<string, object>();
                    health["status"] = "healthy";
                    health["service"] = "NexusFlow Realtime Engine";
                    health["version"] = "3.2.0";
                    health["uptimeSeconds"] = (DateTime.UtcNow - _startTime).TotalSeconds;
                    health["timestamp"] = DateTime.UtcNow.ToString("o");
                    SendJson(res, 200, health);
                    return;
                }

                if (path == "/api/stats")
                {
                    int msgCount = 0;
                    int logCount = 0;
                    lock (_fileLock)
                    {
                        string msgFile = Path.Combine(_dataDir, "messages.json");
                        if (File.Exists(msgFile))
                        {
                            try
                            {
                                List<object> msgs = _jsonSerializer.Deserialize<List<object>>(File.ReadAllText(msgFile));
                                if (msgs != null) msgCount = msgs.Count;
                            }
                            catch { }
                        }
                        string logFile = Path.Combine(_dataDir, "audit_log.json");
                        if (File.Exists(logFile))
                        {
                            try
                            {
                                List<object> logs = _jsonSerializer.Deserialize<List<object>>(File.ReadAllText(logFile));
                                if (logs != null) logCount = logs.Count;
                            }
                            catch { }
                        }
                    }

                    Dictionary<string, object> stats = new Dictionary<string, object>();
                    stats["uptimeSeconds"] = Math.Round((DateTime.UtcNow - _startTime).TotalSeconds);
                    stats["totalRequests"] = Interlocked.Read(ref _requestCount);
                    stats["messagesCount"] = msgCount;
                    stats["auditLogCount"] = logCount;
                    stats["activeSessions"] = _activeSessions.Count;
                    stats["serverTime"] = DateTime.UtcNow.ToString("o");
                    SendJson(res, 200, stats);
                    return;
                }

                // Auth Endpoints
                if (path == "/api/auth/login" && req.HttpMethod == "POST")
                {
                    string body = ReadBody(req);
                    Dictionary<string, object> creds = null;
                    try
                    {
                        creds = _jsonSerializer.Deserialize<Dictionary<string, object>>(body);
                    }
                    catch (Exception jEx)
                    {
                        Dictionary<string, object> bErr = new Dictionary<string, object>();
                        bErr["error"] = "Malformed JSON syntax in login request: " + jEx.Message;
                        SendJson(res, 400, bErr);
                        return;
                    }

                    string user = (creds != null && creds.ContainsKey("username") && creds["username"] != null) ? creds["username"].ToString() : "";
                    string pass = (creds != null && creds.ContainsKey("password") && creds["password"] != null) ? creds["password"].ToString() : "";

                    if (user == _adminUsername && pass == _adminPassword)
                    {
                        string token = "tok_" + Guid.NewGuid().ToString("N");
                        UserSession session = new UserSession();
                        session.Token = token;
                        session.Username = user;
                        session.CreatedAt = DateTime.UtcNow;
                        session.ExpiresAt = DateTime.UtcNow.AddHours(24);

                        lock (_activeSessions)
                        {
                            _activeSessions[token] = session;
                        }

                        LogAudit("AUTH_LOGIN", user, "Successful administrator login");

                        Dictionary<string, object> reply = new Dictionary<string, object>();
                        reply["success"] = true;
                        reply["token"] = token;
                        reply["username"] = user;
                        reply["expiresIn"] = 86400;
                        SendJson(res, 200, reply);
                    }
                    else
                    {
                        LogAudit("AUTH_FAILED", user, "Failed login attempt with bad credentials");
                        Dictionary<string, object> reply = new Dictionary<string, object>();
                        reply["success"] = false;
                        reply["error"] = "Invalid username or password";
                        SendJson(res, 401, reply);
                    }
                    return;
                }

                if (path == "/api/auth/verify" && req.HttpMethod == "GET")
                {
                    string username;
                    if (ValidateToken(req, out username))
                    {
                        Dictionary<string, object> reply = new Dictionary<string, object>();
                        reply["valid"] = true;
                        reply["username"] = username;
                        SendJson(res, 200, reply);
                    }
                    else
                    {
                        Dictionary<string, object> reply = new Dictionary<string, object>();
                        reply["valid"] = false;
                        reply["error"] = "Invalid or expired session token";
                        SendJson(res, 401, reply);
                    }
                    return;
                }

                if (path == "/api/auth/logout" && req.HttpMethod == "POST")
                {
                    string token = GetAuthToken(req);
                    if (!string.IsNullOrEmpty(token))
                    {
                        lock (_activeSessions)
                        {
                            if (_activeSessions.ContainsKey(token))
                            {
                                string u = _activeSessions[token].Username;
                                _activeSessions.Remove(token);
                                LogAudit("AUTH_LOGOUT", u, "User logged out");
                            }
                        }
                    }
                    Dictionary<string, object> reply = new Dictionary<string, object>();
                    reply["success"] = true;
                    SendJson(res, 200, reply);
                    return;
                }

                // Content Endpoints
                if (path == "/api/content")
                {
                    string contentFile = Path.Combine(_dataDir, "content.json");

                    if (req.HttpMethod == "GET")
                    {
                        string json;
                        lock (_fileLock)
                        {
                            if (!File.Exists(contentFile))
                            {
                                string def = Path.Combine(_dataDir, "default_content.json");
                                if (File.Exists(def)) File.Copy(def, contentFile);
                            }
                            json = File.Exists(contentFile) ? File.ReadAllText(contentFile, Encoding.UTF8) : "{}";
                        }
                        string etag = ComputeETag(json);
                        res.Headers["ETag"] = etag;
                        SendRawJson(res, 200, json);
                        return;
                    }

                    if (req.HttpMethod == "PUT" || req.HttpMethod == "POST")
                    {
                        string username;
                        if (!ValidateToken(req, out username))
                        {
                            Dictionary<string, object> err = new Dictionary<string, object>();
                            err["error"] = "Unauthorized. Valid administrator token required.";
                            SendJson(res, 401, err);
                            return;
                        }

                        // Optimistic Concurrency check via If-Match
                        string ifMatch = req.Headers["If-Match"];
                        if (!string.IsNullOrEmpty(ifMatch) && ifMatch != "*")
                        {
                            string currentJson;
                            lock (_fileLock)
                            {
                                currentJson = File.Exists(contentFile) ? File.ReadAllText(contentFile, Encoding.UTF8) : "{}";
                            }
                            string currentEtag = ComputeETag(currentJson);
                            if (!string.Equals(ifMatch.Trim(), currentEtag.Trim(), StringComparison.OrdinalIgnoreCase))
                            {
                                Dictionary<string, object> conflict = new Dictionary<string, object>();
                                conflict["error"] = "Precondition Failed: Content was modified by another administrator. Please refresh before saving.";
                                conflict["code"] = "CONCURRENCY_CONFLICT";
                                conflict["currentEtag"] = currentEtag;
                                SendJson(res, 412, conflict);
                                return;
                            }
                        }

                        string body = ReadBody(req);
                        if (string.IsNullOrEmpty(body))
                        {
                            Dictionary<string, object> err = new Dictionary<string, object>();
                            err["error"] = "Request body cannot be empty";
                            SendJson(res, 400, err);
                            return;
                        }

                        // Validate JSON parsing
                        try
                        {
                            Dictionary<string, object> parsed = _jsonSerializer.Deserialize<Dictionary<string, object>>(body);
                            if (parsed == null || !parsed.ContainsKey("meta") || !parsed.ContainsKey("hero"))
                            {
                                Dictionary<string, object> err = new Dictionary<string, object>();
                                err["error"] = "Invalid schema: Missing required 'meta' or 'hero' root nodes";
                                SendJson(res, 422, err);
                                return;
                            }
                        }
                        catch (Exception pEx)
                        {
                            Dictionary<string, object> err = new Dictionary<string, object>();
                            err["error"] = "Malformed JSON syntax: " + pEx.Message;
                            SendJson(res, 400, err);
                            return;
                        }

                        // Atomically write file with unique temp file name
                        lock (_fileLock)
                        {
                            string tempFile = contentFile + "." + Guid.NewGuid().ToString("N") + ".tmp";
                            File.WriteAllText(tempFile, body, _utf8);
                            File.Copy(tempFile, contentFile, true);
                            try { File.Delete(tempFile); } catch { }
                        }

                        string newEtag = ComputeETag(body);
                        res.Headers["ETag"] = newEtag;

                        LogAudit("UPDATE_CONTENT", username, "Content source updated via Admin API");

                        Dictionary<string, object> ok = new Dictionary<string, object>();
                        ok["success"] = true;
                        ok["message"] = "Content updated successfully in source of truth";
                        ok["etag"] = newEtag;
                        ok["timestamp"] = DateTime.UtcNow.ToString("o");
                        SendJson(res, 200, ok);
                        return;
                    }

                    Dictionary<string, object> mErr = new Dictionary<string, object>();
                    mErr["error"] = "Method Not Allowed";
                    SendJson(res, 405, mErr);
                    return;
                }

                // Reset Content
                if (path == "/api/content/reset" && req.HttpMethod == "POST")
                {
                    string username;
                    if (!ValidateToken(req, out username))
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Unauthorized";
                        SendJson(res, 401, err);
                        return;
                    }

                    string contentFile = Path.Combine(_dataDir, "content.json");
                    string defaultFile = Path.Combine(_dataDir, "default_content.json");

                    if (!File.Exists(defaultFile))
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Default content template not found";
                        SendJson(res, 500, err);
                        return;
                    }

                    lock (_fileLock)
                    {
                        File.Copy(defaultFile, contentFile, true);
                    }

                    LogAudit("RESET_CONTENT", username, "Content restored to factory default template");

                    Dictionary<string, object> ok = new Dictionary<string, object>();
                    ok["success"] = true;
                    ok["message"] = "Content has been reset to default values";
                    SendJson(res, 200, ok);
                    return;
                }

                // Export Content
                if (path == "/api/content/export" && req.HttpMethod == "GET")
                {
                    string contentFile = Path.Combine(_dataDir, "content.json");
                    string json;
                    lock (_fileLock)
                    {
                        json = File.Exists(contentFile) ? File.ReadAllText(contentFile, Encoding.UTF8) : "{}";
                    }

                    res.Headers["Content-Disposition"] = "attachment; filename=\"nexusflow_source_content.json\"";
                    SendRawJson(res, 200, json);
                    return;
                }

                // Import Content
                if (path == "/api/content/import" && req.HttpMethod == "POST")
                {
                    string username;
                    if (!ValidateToken(req, out username))
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Unauthorized";
                        SendJson(res, 401, err);
                        return;
                    }

                    string body = ReadBody(req);
                    try
                    {
                        Dictionary<string, object> parsed = _jsonSerializer.Deserialize<Dictionary<string, object>>(body);
                        if (parsed == null || !parsed.ContainsKey("meta"))
                        {
                            Dictionary<string, object> err = new Dictionary<string, object>();
                            err["error"] = "Invalid schema structure: 'meta' node missing";
                            SendJson(res, 422, err);
                            return;
                        }
                    }
                    catch (Exception ex)
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Invalid JSON format: " + ex.Message;
                        SendJson(res, 400, err);
                        return;
                    }

                    string contentFile = Path.Combine(_dataDir, "content.json");
                    lock (_fileLock)
                    {
                        string tempFile = contentFile + "." + Guid.NewGuid().ToString("N") + ".tmp";
                        File.WriteAllText(tempFile, body, _utf8);
                        File.Copy(tempFile, contentFile, true);
                        try { File.Delete(tempFile); } catch { }
                    }

                    LogAudit("IMPORT_CONTENT", username, "New content imported from external JSON source");

                    Dictionary<string, object> ok = new Dictionary<string, object>();
                    ok["success"] = true;
                    ok["message"] = "Content successfully imported";
                    SendJson(res, 200, ok);
                    return;
                }

                // Contact Messages Endpoints
                if (path == "/api/contact" && req.HttpMethod == "POST")
                {
                    string body = ReadBody(req);
                    Dictionary<string, object> dict = null;
                    try
                    {
                        dict = _jsonSerializer.Deserialize<Dictionary<string, object>>(body);
                    }
                    catch (Exception jEx)
                    {
                        Dictionary<string, object> bErr = new Dictionary<string, object>();
                        bErr["error"] = "Malformed JSON syntax in contact request: " + jEx.Message;
                        SendJson(res, 400, bErr);
                        return;
                    }

                    if (dict == null)
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Invalid request body";
                        SendJson(res, 400, err);
                        return;
                    }

                    string name = (dict.ContainsKey("name") && dict["name"] != null) ? dict["name"].ToString() : "";
                    string email = (dict.ContainsKey("email") && dict["email"] != null) ? dict["email"].ToString() : "";
                    string subject = (dict.ContainsKey("subject") && dict["subject"] != null) ? dict["subject"].ToString() : "General Inquiry";
                    string message = (dict.ContainsKey("message") && dict["message"] != null) ? dict["message"].ToString() : "";

                    if (string.IsNullOrEmpty(name) || string.IsNullOrEmpty(email) || string.IsNullOrEmpty(message))
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Name, email, and message are required fields";
                        SendJson(res, 400, err);
                        return;
                    }

                    ContactMessage msg = new ContactMessage();
                    msg.id = "msg_" + DateTime.UtcNow.Ticks.ToString();
                    msg.name = name.Trim();
                    msg.email = email.Trim();
                    msg.subject = subject.Trim();
                    msg.message = message.Trim();
                    msg.timestamp = DateTime.UtcNow.ToString("o");
                    msg.read = false;

                    string msgFile = Path.Combine(_dataDir, "messages.json");
                    lock (_fileLock)
                    {
                        List<ContactMessage> list = new List<ContactMessage>();
                        if (File.Exists(msgFile))
                        {
                            try
                            {
                                list = _jsonSerializer.Deserialize<List<ContactMessage>>(File.ReadAllText(msgFile)) ?? new List<ContactMessage>();
                            }
                            catch { }
                        }
                        list.Insert(0, msg);
                        File.WriteAllText(msgFile, _jsonSerializer.Serialize(list), _utf8);
                    }

                    LogAudit("CONTACT_FORM", "guest", "New contact inquiry received from " + email);

                    Dictionary<string, object> ok = new Dictionary<string, object>();
                    ok["success"] = true;
                    ok["message"] = "Thank you! Your message has been received. Our team will contact you soon.";
                    SendJson(res, 200, ok);
                    return;
                }

                if (path == "/api/messages" && req.HttpMethod == "GET")
                {
                    string username;
                    if (!ValidateToken(req, out username))
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Unauthorized";
                        SendJson(res, 401, err);
                        return;
                    }

                    string msgFile = Path.Combine(_dataDir, "messages.json");
                    string json = "[]";
                    lock (_fileLock)
                    {
                        if (File.Exists(msgFile)) json = File.ReadAllText(msgFile, Encoding.UTF8);
                    }
                    SendRawJson(res, 200, json);
                    return;
                }

                if (path.StartsWith("/api/messages") && req.HttpMethod == "DELETE")
                {
                    string username;
                    if (!ValidateToken(req, out username))
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Unauthorized";
                        SendJson(res, 401, err);
                        return;
                    }

                    string id = req.QueryString["id"];
                    if (string.IsNullOrEmpty(id) && path.Length > "/api/messages/".Length)
                    {
                        id = path.Substring("/api/messages/".Length);
                    }

                    if (string.IsNullOrEmpty(id))
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Message ID required";
                        SendJson(res, 400, err);
                        return;
                    }

                    string msgFile = Path.Combine(_dataDir, "messages.json");
                    lock (_fileLock)
                    {
                        if (File.Exists(msgFile))
                        {
                            try
                            {
                                List<ContactMessage> list = _jsonSerializer.Deserialize<List<ContactMessage>>(File.ReadAllText(msgFile));
                                if (list != null)
                                {
                                    list.RemoveAll(delegate(ContactMessage m) { return m.id == id; });
                                    File.WriteAllText(msgFile, _jsonSerializer.Serialize(list), _utf8);
                                }
                            }
                            catch { }
                        }
                    }

                    LogAudit("DELETE_MESSAGE", username, "Deleted contact message inquiry with ID: " + id);

                    Dictionary<string, object> ok = new Dictionary<string, object>();
                    ok["success"] = true;
                    ok["message"] = "Message deleted successfully";
                    SendJson(res, 200, ok);
                    return;
                }

                // Audit Log Endpoint
                if (path == "/api/audit-log" && req.HttpMethod == "GET")
                {
                    string username;
                    if (!ValidateToken(req, out username))
                    {
                        Dictionary<string, object> err = new Dictionary<string, object>();
                        err["error"] = "Unauthorized";
                        SendJson(res, 401, err);
                        return;
                    }

                    string logFile = Path.Combine(_dataDir, "audit_log.json");
                    string json = "[]";
                    lock (_fileLock)
                    {
                        if (File.Exists(logFile)) json = File.ReadAllText(logFile, Encoding.UTF8);
                    }
                    SendRawJson(res, 200, json);
                    return;
                }

                Dictionary<string, object> nf = new Dictionary<string, object>();
                nf["error"] = "API endpoint not found: " + path;
                SendJson(res, 404, nf);
            }
            catch (Exception ex)
            {
                Dictionary<string, object> err = new Dictionary<string, object>();
                err["error"] = "Internal server error: " + ex.Message;
                SendJson(res, 500, err);
            }
        }

        private static void HandleStatic(HttpListenerRequest req, HttpListenerResponse res, string path)
        {
            try
            {
                if (path == "/" || path == "/index.html")
                {
                    path = "/index.html";
                }
                else if (path == "/admin" || path == "/admin/")
                {
                    path = "/admin.html";
                }

                // Security: Prevent Directory Traversal
                string sanitized = path.Replace('/', Path.DirectorySeparatorChar).TrimStart(Path.DirectorySeparatorChar);
                string fullPath = Path.GetFullPath(Path.Combine(_publicDir, sanitized));
                string publicDirNormalized = Path.GetFullPath(_publicDir).TrimEnd(Path.DirectorySeparatorChar) + Path.DirectorySeparatorChar;

                if (!fullPath.StartsWith(publicDirNormalized, StringComparison.OrdinalIgnoreCase) && !fullPath.Equals(Path.GetFullPath(_publicDir), StringComparison.OrdinalIgnoreCase))
                {
                    Dictionary<string, object> forbidden = new Dictionary<string, object>();
                    forbidden["error"] = "Access Forbidden";
                    SendJson(res, 403, forbidden);
                    return;
                }

                if (!File.Exists(fullPath))
                {
                    if (path == "/favicon.ico" && File.Exists(Path.Combine(_publicDir, "favicon.svg")))
                    {
                        fullPath = Path.Combine(_publicDir, "favicon.svg");
                    }
                    else
                    {
                        Dictionary<string, object> nf = new Dictionary<string, object>();
                        nf["error"] = "Resource not found: " + path;
                        SendJson(res, 404, nf);
                        return;
                    }
                }

                string ext = Path.GetExtension(fullPath).ToLowerInvariant();
                string contentType = GetMimeType(ext);

                byte[] bytes = File.ReadAllBytes(fullPath);
                res.ContentType = contentType;
                res.ContentLength64 = bytes.Length;
                res.StatusCode = 200;

                // Disable cache on HTML to allow instant reflection
                if (ext == ".html" || ext == ".json")
                {
                    res.Headers["Cache-Control"] = "no-cache, no-store, must-revalidate";
                    res.Headers["Pragma"] = "no-cache";
                    res.Headers["Expires"] = "0";
                }
                else
                {
                    res.Headers["Cache-Control"] = "public, max-age=3600";
                }

                res.OutputStream.Write(bytes, 0, bytes.Length);
                res.Close();
            }
            catch (Exception ex)
            {
                Dictionary<string, object> err = new Dictionary<string, object>();
                err["error"] = "Static serving error: " + ex.Message;
                SendJson(res, 500, err);
            }
        }

        private static string GetMimeType(string ext)
        {
            switch (ext)
            {
                case ".html": return "text/html; charset=utf-8";
                case ".css": return "text/css; charset=utf-8";
                case ".js": return "application/javascript; charset=utf-8";
                case ".json": return "application/json; charset=utf-8";
                case ".svg": return "image/svg+xml";
                case ".png": return "image/png";
                case ".jpg":
                case ".jpeg": return "image/jpeg";
                case ".gif": return "image/gif";
                case ".ico": return "image/x-icon";
                case ".webp": return "image/webp";
                case ".txt": return "text/plain; charset=utf-8";
                case ".map": return "application/json; charset=utf-8";
                case ".woff2": return "font/woff2";
                case ".woff": return "font/woff";
                case ".ttf": return "font/ttf";
                default: return "application/octet-stream";
            }
        }

        private static string ReadBody(HttpListenerRequest req)
        {
            if (req.ContentLength64 > 10 * 1024 * 1024)
            {
                throw new InvalidOperationException("Payload exceeds 10MB limit");
            }
            Encoding encoding = req.ContentEncoding;
            if (encoding == null || encoding.Equals(Encoding.Default))
            {
                encoding = Encoding.UTF8;
            }
            using (var reader = new StreamReader(req.InputStream, encoding))
            {
                return reader.ReadToEnd();
            }
        }

        private static void SendJson(HttpListenerResponse res, int statusCode, object data)
        {
            string json = _jsonSerializer.Serialize(data);
            SendRawJson(res, statusCode, json);
        }

        private static void SendRawJson(HttpListenerResponse res, int statusCode, string rawJson)
        {
            try
            {
                byte[] bytes = _utf8.GetBytes(rawJson);
                res.ContentType = "application/json; charset=utf-8";
                res.StatusCode = statusCode;
                res.ContentLength64 = bytes.Length;
                res.OutputStream.Write(bytes, 0, bytes.Length);
            }
            finally
            {
                try { res.Close(); } catch { }
            }
        }

        private static string ComputeETag(string content)
        {
            if (string.IsNullOrEmpty(content)) return "\"0\"";
            using (var sha = System.Security.Cryptography.SHA256.Create())
            {
                byte[] hash = sha.ComputeHash(_utf8.GetBytes(content));
                StringBuilder sb = new StringBuilder();
                for (int i = 0; i < 8; i++) sb.Append(hash[i].ToString("x2"));
                return "\"" + sb.ToString() + "\"";
            }
        }

        private static string GetAuthToken(HttpListenerRequest req)
        {
            string authHeader = req.Headers["Authorization"];
            if (!string.IsNullOrEmpty(authHeader) && authHeader.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return authHeader.Substring(7).Trim();
            }
            string qToken = req.QueryString["token"];
            if (!string.IsNullOrEmpty(qToken))
            {
                return qToken.Trim();
            }
            return null;
        }

        private static bool ValidateToken(HttpListenerRequest req, out string username)
        {
            username = null;
            string token = GetAuthToken(req);
            if (string.IsNullOrEmpty(token)) return false;

            lock (_activeSessions)
            {
                UserSession session;
                if (_activeSessions.TryGetValue(token, out session))
                {
                    if (session.ExpiresAt > DateTime.UtcNow)
                    {
                        username = session.Username;
                        return true;
                    }
                    _activeSessions.Remove(token);
                }
            }
            return false;
        }

        private static void LogAudit(string action, string user, string details)
        {
            try
            {
                AuditLogEntry entry = new AuditLogEntry();
                entry.id = "aud_" + DateTime.UtcNow.Ticks.ToString();
                entry.timestamp = DateTime.UtcNow.ToString("o");
                entry.action = action;
                entry.user = user;
                entry.details = details;

                string logFile = Path.Combine(_dataDir, "audit_log.json");
                lock (_fileLock)
                {
                    List<AuditLogEntry> list = new List<AuditLogEntry>();
                    if (File.Exists(logFile))
                    {
                        try
                        {
                            list = _jsonSerializer.Deserialize<List<AuditLogEntry>>(File.ReadAllText(logFile)) ?? new List<AuditLogEntry>();
                        }
                        catch { }
                    }
                    list.Insert(0, entry);
                    if (list.Count > 100) list.RemoveRange(100, list.Count - 100);
                    File.WriteAllText(logFile, _jsonSerializer.Serialize(list), Encoding.UTF8);
                }
            }
            catch { }
        }
    }
}
