import { Stack } from "expo-router";
import { StyleSheet } from 'react-native';
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Toaster } from 'sonner-native';
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider style={styles.container}>
        <Toaster />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    userSelect: "none"
  }
});
