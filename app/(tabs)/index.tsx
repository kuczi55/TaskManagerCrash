import { StyleSheet, ScrollView, SafeAreaView, Switch } from "react-native";
import * as BackgroundFetch from "expo-background-fetch";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import * as TaskManager from "expo-task-manager";
import { GeofencingEventType, LocationRegion } from "expo-location";
import { useEffect, useState } from "react";
import * as Location from "expo-location";

const LOCATION_UPDATES_TASK = "location-updates";
const GEOFENCE_TASK = "geofence-task";
const BACKGROUND_FETCH_TASK = "background-fetch";

function timeout(ms: number) {
  return new Promise<void>(resolve => {
    setTimeout(resolve, ms);
  });
}

TaskManager.defineTask<{ locations: Array<Location.LocationObject> }>(
  LOCATION_UPDATES_TASK,
  ({ data: { locations }, error }) => {
    if (error) {
      console.error("Error in location task", error);
      return;
    }
    console.log("Received new locations", locations);
  }
);

TaskManager.defineTask<GeofencingEventType>(
  GEOFENCE_TASK,
  async ({ data, error }) => {
    if (error) {
      console.error("Error in geofencing task", error);
      return;
    }
    await timeout(2500);
    console.log("Received geofencing event", data);
  }
);

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async ({ data, error }) => {
  if (error) {
    console.error("Error in background fetch task", error);
    return;
  }
  console.log("Received new background fetch data", data);
});

async function startBackgroundLocationTracking(
  setIsEnabled: (value: boolean) => void
) {
  const locationRegion: LocationRegion = {
    identifier: "test",
    longitude: -122.4082283,
    latitude: 37.7873517,
    radius: 1000,
  };

  try {
    await Location.startGeofencingAsync(GEOFENCE_TASK, [locationRegion]);
    setIsEnabled(true);
  } catch (error) {
    console.error("Failed to start geofencing", error);
    setIsEnabled(false);
  }
}

async function stopBackgroundLocationTracking(
  setIsEnabled: (value: boolean) => void
) {
  try {
    await Location.stopGeofencingAsync(GEOFENCE_TASK);
    setIsEnabled(false);
  } catch (error) {
    console.error("Failed to stop geofencing", error);
    setIsEnabled(true);
  }
}

async function startSubscriptionTask(setIsEnabled: (value: boolean) => void) {
  try {
    await Location.startLocationUpdatesAsync(LOCATION_UPDATES_TASK, {
      deferredUpdatesInterval: 5000,
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 5000,
    });
    setIsEnabled(true);
  } catch (error) {
    console.error("Failed to start location updates task", error);
    setIsEnabled(false);
  }
}

async function stopSubscriptionTask(setIsEnabled: (value: boolean) => void) {
  try {
    await Location.stopLocationUpdatesAsync(LOCATION_UPDATES_TASK);
    setIsEnabled(false);
  } catch (error) {
    console.error("Failed to stop location updates task", error);
    setIsEnabled(true);
  }
}

async function startScheduledTask(setIsEnabled: (value: boolean) => void) {
  try {
    await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
      minimumInterval: 15 * 60,
      stopOnTerminate: false,
      startOnBoot: true,
    });
    setIsEnabled(true);
  } catch (error) {
    console.error("Failed to start background fetch task", error);
    setIsEnabled(false);
  }
}

async function stopScheduledTask(setIsEnabled: (value: boolean) => void) {
  try {
    await BackgroundFetch.unregisterTaskAsync(BACKGROUND_FETCH_TASK);
    setIsEnabled(false);
  } catch (error) {
    console.error("Failed to stop background fetch task", error);
    setIsEnabled(true);
  }
}

export default function HomeScreen() {
  const [isGeofenceEnabled, setIsGeofenceEnabled] = useState(false);
  const [isLocationUpdatesEnabled, setIsLocationUpdatesEnabled] =
    useState(false);
  const [isBackgroundFetchEnabled, setIsBackgroundFetchEnabled] =
    useState(false);

  useEffect(() => {
    (async () => {
      const isGeofenceRegistered = await TaskManager.isTaskRegisteredAsync(
        GEOFENCE_TASK
      );
      setIsGeofenceEnabled(isGeofenceRegistered);

      const isLocationUpdatesRegistered =
        await TaskManager.isTaskRegisteredAsync(LOCATION_UPDATES_TASK);

      setIsLocationUpdatesEnabled(isLocationUpdatesRegistered);

      const isBackgroundFetchRegistered =
        await TaskManager.isTaskRegisteredAsync(BACKGROUND_FETCH_TASK);

      setIsBackgroundFetchEnabled(isBackgroundFetchRegistered);
    })();
  }, []);

  return (
    <ThemedView style={[styles.titleContainer, styles.rootContainer]}>
      <SafeAreaView style={styles.rootContainer}>
        <ScrollView contentContainerStyle={styles.rootContainer}>
          <ThemedView style={styles.titleContainer}>
            <ThemedText type="title">Welcome!</ThemedText>
          </ThemedView>
          <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">Geofence</ThemedText>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isGeofenceEnabled ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={async (value) => {
                value
                  ? await startBackgroundLocationTracking(setIsGeofenceEnabled)
                  : await stopBackgroundLocationTracking(setIsGeofenceEnabled);
              }}
              value={isGeofenceEnabled}
            />
          </ThemedView>
          <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">Location Updates</ThemedText>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isLocationUpdatesEnabled ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={async (value) => {
                value
                  ? await startSubscriptionTask(setIsLocationUpdatesEnabled)
                  : await stopSubscriptionTask(setIsLocationUpdatesEnabled);
              }}
              value={isLocationUpdatesEnabled}
            />
          </ThemedView>
          <ThemedView style={styles.stepContainer}>
            <ThemedText type="subtitle">Background Fetch</ThemedText>
            <Switch
              trackColor={{ false: "#767577", true: "#81b0ff" }}
              thumbColor={isBackgroundFetchEnabled ? "#f5dd4b" : "#f4f3f4"}
              ios_backgroundColor="#3e3e3e"
              onValueChange={async (value) => {
                value
                  ? await startScheduledTask(setIsBackgroundFetchEnabled)
                  : await stopScheduledTask(setIsBackgroundFetchEnabled);
              }}
              value={isBackgroundFetchEnabled}
            />
          </ThemedView>
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
});
