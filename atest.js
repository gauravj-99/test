const http = require('http');
const https = require('https');
const { URL } = require('url');

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const AUTH_BASE = `${BASE_URL}/api/auth`;

function request(method, requestUrl, body = null, headers = {}) {
  const url = new URL(requestUrl);
  const lib = url.protocol === 'https:' ? https : http;
  const data = body != null ? JSON.stringify(body) : null;

  const requestOptions = {
    method,
    hostname: url.hostname,
    port: url.port || (url.protocol === 'https:' ? 443 : 80),
    path: `${url.pathname}${url.search}`,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  };

  if (data) {
    requestOptions.headers['Content-Length'] = Buffer.byteLength(data);
  }

  return new Promise((resolve, reject) => {
    const req = lib.request(requestOptions, (res) => {
      let chunks = '';
      res.on('data', (chunk) => {
        chunks += chunk;
      });
      res.on('end', () => {
        let parsed = chunks;
        try {
          parsed = chunks ? JSON.parse(chunks) : null;
        } catch (err) {
          return reject(new Error(`Unable to parse JSON response: ${chunks}`));
        }
        resolve({ status: res.statusCode, body: parsed });
      });
    });

    req.on('error', reject);
    if (data) req.write(data);
    req.end();
  });
}

function log(title, result) {
  console.log(`\n=== ${title} ===`);
  console.log('status:', result.status);
  console.log('body:', JSON.stringify(result.body, null, 2));
}

async function run() {
  console.log('Base URL:', BASE_URL);
  console.log('Starting API test sequence...');

  try {
    const health = await request('GET', `${BASE_URL}/`);
    log('Health Check', health);
  } catch (err) {
    console.error('\nFailed health check:', err.message);
    process.exit(1);
  }

  const timestamp = Date.now();
  const employeeEmail = `employee.${timestamp}@example.com`;
  const managerEmail = `manager.${timestamp}@example.com`;

  const employeeData = {
    name: 'Alice Employee',
    email: employeeEmail,
    password: 'Password123!',
    role: 'employee',
  };

  const managerData = {
    name: 'Bob Manager',
    email: managerEmail,
    password: 'Password123!',
    role: 'manager',
  };

  const employeeRegister = await request('POST', `${AUTH_BASE}/register`, employeeData);
  log('Employee Registration', employeeRegister);

  const managerRegister = await request('POST', `${AUTH_BASE}/register`, managerData);
  log('Manager Registration', managerRegister);

  const employeeLogin = await request('POST', `${AUTH_BASE}/login`, {
    email: employeeData.email,
    password: employeeData.password,
  });
  log('Employee Login', employeeLogin);

  const managerLogin = await request('POST', `${AUTH_BASE}/login`, {
    email: managerData.email,
    password: managerData.password,
  });
  log('Manager Login', managerLogin);

  const employeeToken = employeeLogin.body && employeeLogin.body.token;
  const managerToken = managerLogin.body && managerLogin.body.token;

  if (!employeeToken || !managerToken) {
    console.error('\nMissing login token for employee or manager. Cannot continue protected tests.');
    process.exit(1);
  }

  const profileEmployee = await request('GET', `${AUTH_BASE}/profile`, null, {
    Authorization: `Bearer ${employeeToken}`,
  });
  log('Employee Profile', profileEmployee);

  const leavePayload = {
    fromDate: '2026-05-25',
    toDate: '2026-05-28',
    reason: 'Family event',
  };

  const applyLeave = await request('POST', `${AUTH_BASE}/apply_leave`, leavePayload, {
    Authorization: `Bearer ${employeeToken}`,
  });
  log('Apply Leave', applyLeave);

  const myLeaves = await request('GET', `${AUTH_BASE}/my_leaves`, null, {
    Authorization: `Bearer ${employeeToken}`,
  });
  log('My Leaves', myLeaves);

  const allLeaves = await request('GET', `${AUTH_BASE}/all_leaves`, null, {
    Authorization: `Bearer ${managerToken}`,
  });
  log('All Leaves (Manager)', allLeaves);

  const leaveId = Array.isArray(myLeaves.body) && myLeaves.body.length > 0 ? myLeaves.body[0]._id : null;

  if (!leaveId) {
    console.error('\nCould not find a leave ID to update. Ensure the employee leave was created successfully.');
    process.exit(1);
  }

  const updateLeave = await request('POST', `${AUTH_BASE}/update_leave`, {
    leaveId,
    status: 'approved',
  }, {
    Authorization: `Bearer ${managerToken}`,
  });
  log('Update Leave Status', updateLeave);

  const allLeavesAfterUpdate = await request('GET', `${AUTH_BASE}/all_leaves`, null, {
    Authorization: `Bearer ${managerToken}`,
  });
  log('All Leaves After Update', allLeavesAfterUpdate);

  console.log('\nAPI test sequence complete.');
}

run().catch((err) => {
  console.error('\nFatal error running tests:', err.message);
  process.exit(1);
});
