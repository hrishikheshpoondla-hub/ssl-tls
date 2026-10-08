# generate-cert.ps1
# Generates a self-signed TLS certificate for localhost using Windows built-in tools.
# No openssl required.

param()

$certDir = Join-Path $PSScriptRoot "cert"
New-Item -ItemType Directory -Force -Path $certDir | Out-Null

Write-Host "[Cert] Creating self-signed certificate for localhost..."

$cert = New-SelfSignedCertificate `
    -DnsName "localhost" `
    -CertStoreLocation "Cert:\CurrentUser\My" `
    -NotAfter (Get-Date).AddDays(365) `
    -KeyAlgorithm RSA `
    -KeyLength 2048 `
    -HashAlgorithm SHA256 `
    -KeyUsage DigitalSignature, KeyEncipherment `
    -TextExtension @("2.5.29.17={text}DNS=localhost&IPAddress=127.0.0.1")

$thumbprint = $cert.Thumbprint
Write-Host "[Cert] Certificate thumbprint: $thumbprint"

# --- Export certificate (CRT) -----------------------------------------------
$derPath = Join-Path $certDir "server.der"
Export-Certificate -Cert "Cert:\CurrentUser\My\$thumbprint" `
    -FilePath $derPath -Type CERT | Out-Null

# Convert DER to PEM
$derBytes = [System.IO.File]::ReadAllBytes($derPath)
$b64 = [Convert]::ToBase64String($derBytes)
$lines = ($b64 -split '(.{64})' | Where-Object { $_ -ne '' }) -join "`n"
$pemCert = "-----BEGIN CERTIFICATE-----`n$lines`n-----END CERTIFICATE-----`n"
$crtPath = Join-Path $certDir "server.crt"
[System.IO.File]::WriteAllText($crtPath, $pemCert)
Remove-Item $derPath -Force
Write-Host "[Cert] Certificate written to: cert/server.crt"

# --- Export private key (KEY) -----------------------------------------------
$pfxPath  = Join-Path $certDir "server_temp.pfx"
$pfxPwd   = ConvertTo-SecureString -String "TempPass999!" -Force -AsPlainText
Export-PfxCertificate -Cert "Cert:\CurrentUser\My\$thumbprint" `
    -FilePath $pfxPath -Password $pfxPwd | Out-Null

$pfxObj = [System.Security.Cryptography.X509Certificates.X509Certificate2]::new(
    $pfxPath, $pfxPwd,
    [System.Security.Cryptography.X509Certificates.X509KeyStorageFlags]::Exportable
)
$rsa     = $pfxObj.GetRSAPrivateKey()
$pkcs8   = $rsa.ExportPkcs8PrivateKey()
$keyB64  = [Convert]::ToBase64String($pkcs8)
$keyLines = ($keyB64 -split '(.{64})' | Where-Object { $_ -ne '' }) -join "`n"
$pemKey   = "-----BEGIN PRIVATE KEY-----`n$keyLines`n-----END PRIVATE KEY-----`n"
$keyPath  = Join-Path $certDir "server.key"
[System.IO.File]::WriteAllText($keyPath, $pemKey)
Remove-Item $pfxPath -Force
Write-Host "[Cert] Private key written to:  cert/server.key"

# --- Remove from Windows cert store -----------------------------------------
Remove-Item "Cert:\CurrentUser\My\$thumbprint" -Force
Write-Host "[Cert] Removed temporary cert from Windows store."

Write-Host ""
Write-Host "[Cert] SUCCESS - TLS certificate generated!"
Write-Host "       cert/server.crt  <- present certificate to browser"
Write-Host "       cert/server.key  <- PRIVATE KEY - never share or commit!"
Write-Host ""
Write-Host "[Cert] These files are in .gitignore and will not be committed to git."
