import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { Provider as PaperProvider, DefaultTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import CollectorScreen from './screens/CollectorScreen';
import ConsumerScanScreen from './screens/ConsumerScanScreen';

const Stack = createStackNavigator();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#4CAF50',
    accent: '#2196F3',
    background: '#1a1a1a',
    surface: '#2d2d2d',
    text: '#ffffff',
    placeholder: '#888888',
  },
  dark: true,
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <NavigationContainer>
          <StatusBar style="light" backgroundColor="#1a1a1a" />
          <Stack.Navigator
            initialRouteName="Collector"
            screenOptions={{
              headerStyle: {
                backgroundColor: '#1a1a1a',
                elevation: 0,
                shadowOpacity: 0,
                borderBottomWidth: 0,
              },
              headerTintColor: '#ffffff',
              headerTitleStyle: {
                fontWeight: 'bold',
                fontSize: 18,
              },
              cardStyle: {
                backgroundColor: '#1a1a1a',
              },
            }}
          >
            <Stack.Screen
              name="Collector"
              component={CollectorScreen}
              options={{
                title: 'TraceAyur Collector',
                headerLeft: () => null,
              }}
            />
            <Stack.Screen
              name="ConsumerScan"
              component={ConsumerScanScreen}
              options={{
                title: 'Product Scanner',
              }}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}