plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.nexa.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.nexa.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 23
        versionName = "1.0.18"
        testInstrumentationRunner = "com.nexa.app.BackupInstrumentation"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }

    // Keep each ZIP independently buildable in Android Studio. No custom signingConfig here:
    // debug builds intentionally use this computer's existing Android debug.keystore.
    applicationVariants.all {
        val variantBuildType = buildType.name
        outputs.all {
            (this as com.android.build.gradle.internal.api.ApkVariantOutputImpl).outputFileName = "Nexa-Stable-1.0.18-${variantBuildType}.apk"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
}
