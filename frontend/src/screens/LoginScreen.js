import React, { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { palette } from '../theme/colors';

export default function LoginScreen({ navigation }) {
  const { login, loginDemo } = useApp();
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password123');
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const disabledStyles = useMemo(() => (loading ? { opacity: 0.6 } : null), [loading]);

  const validate = () => {
    const nextErrors = {};
    const emailValue = email.trim();
    if (!emailValue || !/^\S+@\S+\.\S+$/.test(emailValue)) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password || password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const sharedLogin = async (nextEmail, nextPassword) => {
    if (!validate()) {
      return;
    }
    setLoading(true);
    setFormError('');
    try {
      await login(nextEmail.trim(), nextPassword);
    } catch (error) {
      setFormError(error.message || 'Login failed.');
    }
    setLoading(false);
  };

  const onLogin = () => sharedLogin(email, password);
  const onDemoLogin = async () => {
    setEmail('demo@cookmate.com');
    setPassword('demo123');
    setFieldErrors({});
    setFormError('');
    try {
      setLoading(true);
      await loginDemo();
    } catch {
      Alert.alert('Login Failed', 'Unable to launch the demo account.');
    } finally {
      setLoading(false);
    }
  };

  const onForgotPassword = () => {
    Alert.alert('Reset Password', 'Password reset is not available in this demo yet. Please contact support.');
  };

  return (
    <View style={styles.container}>
      <View style={styles.accentOne} />
      <View style={styles.accentTwo} />
      <View style={styles.card}>
        <Text style={styles.kicker}>Cook smarter</Text>
        <Text style={styles.title}>Welcome Back 👋</Text>
        <Text style={styles.subtitle}>Plan groceries, track nutrition, and discover hostel-friendly meals.</Text>

        <TextInput
          placeholder="Email"
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            if (fieldErrors.email) {
              setFieldErrors((prev) => ({ ...prev, email: undefined }));
            }
          }}
          style={[styles.input, fieldErrors.email && styles.inputError]}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          style={[styles.input, fieldErrors.password && styles.inputError]}
          secureTextEntry
        />
        {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}
        {formError ? <Text style={styles.formError}>{formError}</Text> : null}

        <TouchableOpacity style={[styles.btn, styles.primaryBtn, disabledStyles]} onPress={onLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Ionicons name="log-in-outline" size={20} color="#fff" />}
          <Text style={styles.btnText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.btn, styles.demoBtn, disabledStyles]} onPress={onDemoLogin} disabled={loading}>
          <Ionicons name="sparkles-outline" size={20} color={palette.primaryDark} />
          <Text style={[styles.btnText, styles.demoBtnText]}>Use Demo Account</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onForgotPassword}>
          <Text style={styles.link}>Forgot password?</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Signup')}>
          <Text style={styles.link}>No account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, padding: 20, justifyContent: 'center' },
  accentOne: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 999,
    backgroundColor: '#FFF1CC',
    top: -40,
    right: -60,
  },
  accentTwo: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 999,
    backgroundColor: '#FFE1D6',
    bottom: -30,
    left: -40,
  },
  card: {
    backgroundColor: palette.card,
    borderRadius: 24,
    padding: 24,
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  kicker: { color: palette.secondary, fontWeight: '700', marginBottom: 4 },
  title: { fontSize: 30, fontWeight: '800', color: palette.text, marginBottom: 8 },
  subtitle: { color: '#555', marginBottom: 20 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  inputError: { borderColor: '#E74C3C' },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
  },
  primaryBtn: { backgroundColor: palette.primary },
  btnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  demoBtn: { backgroundColor: '#FFF4EE', borderWidth: 1, borderColor: '#FFD6C4' },
  demoBtnText: { color: palette.secondary },
  link: { color: palette.secondary, textAlign: 'center', fontWeight: '700', marginTop: 4 },
  errorText: { color: '#E74C3C', marginBottom: 8, fontSize: 12 },
  formError: { color: '#E74C3C', marginBottom: 12, textAlign: 'center', fontWeight: '600' },
});
