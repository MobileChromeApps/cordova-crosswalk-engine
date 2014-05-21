

Apache Cordova Crosswalk Engine Proof-of-Concept
===

Cordova Crosswalk Engine is a part of a Proof-of-Concept for 
third party engines to work with Apache Cordova.  This currently only works with a
personal fork of Apache Cordova found on GitHub, and as of yet, does not work with any
official Apache Cordova release.  This code should be considered very experimental.


Directions (We're still trying to automate this, sorry):

1. Pull down the pluggable_webview branch of Apache Cordova found here (https://github.com/apache/cordova-android/tree/pluggable_webview)
2. Generate a project with ./bin/create
3. Run Plugman: plugman install --platform android --plugin <path_to_crosswalk_engine>/cordova-crosswalk-engine/ --project .
4. Add the xwalk_core_library as a dependency in project.properties. (Note: Relative Paths work for libraries, not absolute paths.  Manually edit if necessary.)
