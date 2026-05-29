import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Lemo OTT App is Running!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0000ff', // Pure Blue background
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: '#ffffff', // White text
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});


