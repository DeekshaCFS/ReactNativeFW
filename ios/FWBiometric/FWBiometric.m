// iOS counterpart of android BiometricAuthModule.kt (Java BiometricAuthHelper):
// Face ID / Touch ID with the device passcode as fallback.
#import <React/RCTBridgeModule.h>
#import <LocalAuthentication/LocalAuthentication.h>

@interface FWBiometric : NSObject <RCTBridgeModule>
@end

@implementation FWBiometric

RCT_EXPORT_MODULE(FWBiometric)

+ (BOOL)requiresMainQueueSetup { return NO; }

RCT_EXPORT_METHOD(isAvailable:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  NSError *error = nil;
  BOOL ok = [context canEvaluatePolicy:LAPolicyDeviceOwnerAuthentication error:&error];
  resolve(@(ok));
}

RCT_EXPORT_METHOD(authenticate:(NSString *)title
                  subtitle:(NSString *)subtitle
                  description:(NSString *)description
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)
{
  LAContext *context = [[LAContext alloc] init];
  [context evaluatePolicy:LAPolicyDeviceOwnerAuthentication
          localizedReason:(description.length ? description : title)
                    reply:^(BOOL success, NSError *error) {
    if (success) {
      resolve(@YES);
      return;
    }
    BOOL canceled = error.code == LAErrorUserCancel || error.code == LAErrorSystemCancel ||
                    error.code == LAErrorAppCancel;
    reject(canceled ? @"CANCELED" : @"ERROR", error.localizedDescription, error);
  }];
}

@end
