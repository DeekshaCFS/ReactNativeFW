Pod::Spec.new do |s|
  s.name         = "FWBiometric"
  s.version      = "1.0.0"
  s.summary      = "Biometric / device-passcode prompt used for quick login"
  s.homepage     = "https://fieldweb.local"
  s.license      = "MIT"
  s.authors      = { "FieldWeb" => "dev@fieldweb.local" }
  s.platforms    = { :ios => "13.0" }
  s.source       = { :path => "." }
  s.source_files = "*.{h,m}"
  s.frameworks   = "LocalAuthentication"
  s.dependency "React-Core"
end
