# Proguard rules for Firebase Fleet Manager
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
-keepattributes JavascriptInterface
-keepclassmembers class com.purushotham.fleetmanager.MainActivity$** {
    *;
}
