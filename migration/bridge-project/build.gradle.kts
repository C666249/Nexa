plugins {
    id("com.android.application") version "8.7.3" apply false
    id("org.jetbrains.kotlin.android") version "2.1.0" apply false
}

// V1.40.6: V1.40.5/V1.40.3 runtime baseline plus checklist-collapse repaint stabilization and Note title-surface fix.
// Android Studio is the supported build path; no stale cross-flavor buildBoth task is kept here.
