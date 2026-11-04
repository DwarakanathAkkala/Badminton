import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppProvider } from './src/context/AppContext';
import HomeScreen from './src/screens/HomeScreen';
import NewGameScreen from './src/screens/NewGameScreen';
import GameDetailScreen from './src/screens/GameDetailScreen';
import PlayersScreen from './src/screens/PlayersScreen';
import PlayerDetailScreen from './src/screens/PlayerDetailScreen';
import ShuttlesScreen from './src/screens/ShuttlesScreen';
import ExpensesScreen from './src/screens/ExpensesScreen';
import DashboardScreen from './src/screens/DashboardScreen';

export type RootStack = {
  Home: undefined;
  NewGame: undefined;
  GameDetail: { id: string };
  Players: undefined;
  PlayerDetail: { id: string };
  Shuttles: undefined;
  Expenses: undefined;
  Dashboard: undefined;
};

const Stack = createNativeStackNavigator<RootStack>();

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <NavigationContainer>
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Badminton' }} />
            <Stack.Screen name="NewGame" component={NewGameScreen} options={{ title: 'New Game' }} />
            <Stack.Screen name="GameDetail" component={GameDetailScreen} options={{ title: 'Game Details' }} />
            <Stack.Screen name="Players" component={PlayersScreen} options={{ title: 'Players' }} />
            <Stack.Screen name="PlayerDetail" component={PlayerDetailScreen} options={{ title: 'Player' }} />
            <Stack.Screen name="Shuttles" component={ShuttlesScreen} options={{ title: 'Shuttles' }} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} options={{ title: 'Expenses' }} />
            <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'My Earnings' }} />
          </Stack.Navigator>
        </NavigationContainer>
      </AppProvider>
    </SafeAreaProvider>
  );
}