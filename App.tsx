import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import MenuScreen from './screens/MenuScreen';
import TicTacToeScreen from './screens/TicTacToeScreen';
import SettingsScreen from "./screens/SettingsScreen";
import {Provider as PaperProvider} from 'react-native-paper';

const Stack = createStackNavigator();

export default function App() {
    return (
        <PaperProvider>
            <NavigationContainer>
                <Stack.Navigator initialRouteName="Menu" id={undefined}>
                    <Stack.Screen name="Menu" component={MenuScreen} options={{headerShown: false}}/>
                    <Stack.Screen name="Instellingen" component={SettingsScreen}/>
                    <Stack.Screen name="Spel" component={TicTacToeScreen}/>
                </Stack.Navigator>
            </NavigationContainer>
        </PaperProvider>
    );
}
