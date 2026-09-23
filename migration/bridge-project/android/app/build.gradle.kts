plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.todolist.app"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.todolist.app"
        minSdk = 26
        targetSdk = 35
        versionCode = 1407
        versionName = "1.40.7-migration"
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
            (this as com.android.build.gradle.internal.api.ApkVariantOutputImpl).outputFileName = "To-Do-1.40.7-Migration-${variantBuildType}.apk"
        }
    }
}

dependencies {
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("androidx.appcompat:appcompat:1.7.0")
}
