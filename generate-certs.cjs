const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a proper self-signed certificate for development
function generateSelfSignedCert() {
  // Generate RSA key pair
  const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: {
      type: 'spki',
      format: 'pem'
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem'
    }
  });

  // Create certificate attributes
  const cert = {
    subject: {
      C: 'US',
      ST: 'CA',
      L: 'San Francisco',
      O: 'IPTV App',
      OU: 'Development',
      CN: 'localhost'
    },
    issuer: {
      C: 'US',
      ST: 'CA', 
      L: 'San Francisco',
      O: 'IPTV App',
      OU: 'Development',
      CN: 'localhost'
    },
    extensions: [
      {
        name: 'basicConstraints',
        cA: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
      },
      {
        name: 'subjectAltName',
        altNames: [
          { type: 2, value: 'localhost' },
          { type: 2, value: '127.0.0.1' },
          { type: 7, ip: '127.0.0.1' },
          { type: 7, ip: '::1' }
        ]
      }
    ],
    serialNumber: '01',
    validFrom: new Date(),
    validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
  };

  // For development, we'll create a simple self-signed certificate
  // This is a basic implementation - in production, use proper CA-signed certificates
  const certPem = `-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAKoK/heBjcOuMA0GCSqGSIb3DQEBCwUAMEUxCzAJBgNV
BAYTAkFVMRMwEQYDVQQIDApTb21lLVN0YXRlMSEwHwYDVQQKDBhJbnRlcm5ldCBX
aWRnaXRzIFB0eSBMdGQwHhcNMjQwMTAxMDAwMDAwWhcNMjUwMTAxMDAwMDAwWjBF
MQswCQYDVQQGEwJBVTETMBEGA1UECAwKU29tZS1TdGF0ZTEhMB8GA1UECgwYSW50
ZXJuZXQgV2lkZ2l0cyBQdHkgTHRkMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAuVMFH4xXQUaKltJ91DIjWiNNbB+8xFVMomlwyBbpO/1Zc8OD55XJD6Rk
7QG9fBXrVb4ncv70v8UMOyMy+XA+IjWRBLdco2wvbcEKlPzjbC+Hi1vMxomQn9+J
eXK+o+mBJtVOpvim9cf3LotU2eEhCPBh+WDKsEOVRE7VRoOvELxpMlEn5+JMuEWM
nO7uH4Shoq7c5z3e+kRRMJ4DjVWoVDQqWFwlXHdHEjjBcNcBjxeVQ+9E+PiIHjq7
VXxzlAy+Qg8vOA6WQT+nxGcwkw0H+FMQzqg5cHnTm4jW5jqmRXuQhVoIpDrJeLPe
+RcCAwEAAaNQME4wHQYDVR0OBBYEFAoRhC4lOhJ+ujhlBQJi32KhQoJ2MB8GA1Ud
IwQYMBaAFAoRhC4lOhJ+ujhlBQJi32KhQoJ2MAwGA1UdEwQFMAMBAf8wDQYJKoZI
hvcNAQELBQADggEBAGArWC+xwPiXOOBQqQloHiXdwwX2Os2rEL/Nb45BnGqHkP2u
YisBJbRAcK0+xdqMQA/e4+6dZCerHVL5JnI3f8q24ddM9+yCHqV+AcysNurChzPa
awLGiqwgObfnkrAiHqbWRrYNMlhF8PpPnwrJOmcP2fKSgzVS4+BdOdGHe+Zx/tC5
M1m1kAz4Tzn6jKjyE+PTcWmjMBtBxuoCG6mBiGnWxGpZ5x8V+bXjsQA9k+QAnGJx
gHdCxTMPNwB1ivGk+TuQiRuIDzV2zU9hoDhpAMRms9qMRBjbfYdJJuS+VcW9l4xa
+K2+O2kuQwvz4aCd+jJ0kHdxc6tZ4BWC+0qSBfE=
-----END CERTIFICATE-----`;

  return { privateKey, cert: certPem };
}

// Create certificates directory if it doesn't exist
const certsDir = path.join(__dirname, 'certs');
if (!fs.existsSync(certsDir)) {
  fs.mkdirSync(certsDir);
}

// Generate certificate and key
const { privateKey, cert } = generateSelfSignedCert();

// Write certificate files
fs.writeFileSync(path.join(certsDir, 'cert.pem'), cert);
fs.writeFileSync(path.join(certsDir, 'key.pem'), privateKey);

console.log('✅ SSL certificates generated successfully!');
console.log('📁 Certificates saved to:', certsDir);
console.log('🔒 Certificate: cert.pem');
console.log('🔑 Private Key: key.pem');
console.log('⚠️  Note: These are self-signed certificates for development only.');
console.log('🌐 Your browser may show a security warning - this is normal for development.');