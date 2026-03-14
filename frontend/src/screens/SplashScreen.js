import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { palette } from '../theme/colors';

export default function SplashScreen({ navigation }) {
  useEffect(() => {
    const id = setTimeout(() => navigation.replace('Login'), 1200);
    return () => clearTimeout(id);
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>CookMate Student</Text>
      <Text style={styles.sub}>Smart cooking for hostel & student life</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, justifyContent: 'center', alignItems: 'center' },
  logo: { fontSize: 32, fontWeight: '800', color: palette.primary },
  sub: { marginTop: 8, color: palette.text },
});
