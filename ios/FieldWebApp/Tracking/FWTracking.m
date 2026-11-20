//
//  FWTracking.m
//  Exposes the Swift FWTracking module to React Native (JS: NativeModules.FWTracking).
//

#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(FWTracking, RCTEventEmitter)

RCT_EXTERN_METHOD(start:(NSString *)userId
                  taskId:(nonnull NSNumber *)taskId
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(stop:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(reportLocation:(NSString *)timestampMs
                  latitude:(double)latitude
                  longitude:(double)longitude
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

@end