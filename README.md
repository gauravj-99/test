# Backend API Test Requests

> Before testing locally:
> 1. Ensure MongoDB is running on `mongodb://127.0.0.1:27017` or set `MONGO_URI` in a `.env` file.
> 2. Start the server in `Backend` with:
>    ```bash
>    node server.js
>    ```
> 3. The API base URL is: `http://localhost:5000/api/auth`

---

## 1. Health Check

- URL: `http://localhost:5000/`
- Method: `GET`

### Curl
```bash
curl http://localhost:5000/
```

Expected response: `API is running`

---

## 2. Register User

- URL: `http://localhost:5000/api/auth/register`
- Method: `POST`
- Headers:
  - `Content-Type: application/json`

### Employee Registration Example
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alice Employee",
    "email": "alice@example.com",
    "password": "password123",
    "role": "employee"
  }'
```

### Manager Registration Example
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Bob Manager",
    "email": "bob@example.com",
    "password": "password123",
    "role": "manager"
  }'
```

Expected response:
```json
{ "message": "user registered" }
```

---

## 3. Login

- URL: `http://localhost:5000/api/auth/login`
- Method: `POST`
- Headers:
  - `Content-Type: application/json`

### Login Example
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "password123"
  }'
```

Expected response contains a token:
```json
{ "message": "YOu are login", "token": "<JWT_TOKEN>" }
```

Save the returned `token` for protected requests.

---

## 4. Get Profile (Protected)

- URL: `http://localhost:5000/api/auth/profile`
- Method: `GET`
- Headers:
  - `Authorization: Bearer <JWT_TOKEN>`

### Curl
```bash
curl http://localhost:5000/api/auth/profile \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Expected response example:
```json
{
  "message": "This is protected data",
  "user": {
    "id": "...",
    "role": "employee"
  }
}
```

---

## 5. Apply Leave (Employee)

- URL: `http://localhost:5000/api/auth/apply_leave`
- Method: `POST`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`

### Body
```json
{
  "fromDate": "2026-05-20",
  "toDate": "2026-05-22",
  "reason": "Family event"
}
```

### Curl
```bash
curl -X POST http://localhost:5000/api/auth/apply_leave \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "fromDate": "2026-05-20",
    "toDate": "2026-05-22",
    "reason": "Family event"
  }'
```

Expected response:
```json
{ "message": "Leave Applied" }
```

---

## 6. Get My Leaves (Employee)

- URL: `http://localhost:5000/api/auth/my_leaves`
- Method: `GET`
- Headers:
  - `Authorization: Bearer <JWT_TOKEN>`

### Curl
```bash
curl http://localhost:5000/api/auth/my_leaves \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Expected response: array of leave objects for the logged-in user.

---

## 7. Get All Leaves (Manager)

- URL: `http://localhost:5000/api/auth/all_leaves`
- Method: `GET`
- Headers:
  - `Authorization: Bearer <JWT_TOKEN>`

### Curl
```bash
curl http://localhost:5000/api/auth/all_leaves \
  -H "Authorization: Bearer <JWT_TOKEN>"
```

Expected response: array of all leave records, including `userid` populated with `name` and `email`.

---

## 8. Update Leave Status (Manager)

- URL: `http://localhost:5000/api/auth/update_leave`
- Method: `POST`
- Headers:
  - `Content-Type: application/json`
  - `Authorization: Bearer <JWT_TOKEN>`

### Body
```json
{
  "leaveId": "<LEAVE_ID>",
  "status": "approved"
}
```

### Curl
```bash
curl -X POST http://localhost:5000/api/auth/update_leave \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <JWT_TOKEN>" \
  -d '{
    "leaveId": "<LEAVE_ID>",
    "status": "approved"
  }'
```

Expected response:
```json
{ "message": "Leave status updated" }
```

---

## Notes

- If you see `MongooseServerSelectionError: connect ECONNREFUSED`, MongoDB is not running locally.
- For local testing, make sure `node server.js` is running in the `Backend` folder.
- Use the manager account token for `all_leaves` and `update_leave` endpoints.
- Use the employee account token for `apply_leave` and `my_leaves` endpoints.
