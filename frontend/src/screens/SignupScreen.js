import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '../context/AppContext';
import { palette } from '../theme/colors';

export default function SignupScreen({ navigation }) {
  const { signup } = useApp();
  const [name, setName] = useState('Student');
  const [email, setEmail] = useState('student@example.com');
  const [password, setPassword] = useState('password123');
  const [confirmPassword, setConfirmPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [formError, setFormError] = useState('');
  const [loading, setLoading] = useState(false);

  const disabledStyles = useMemo(() => (loading ? { opacity: 0.6 } : null), [loading]);

  const validate = () => {
    const nextErrors = {};
    if (!name.trim()) {
      nextErrors.name = 'Name is required.';
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      nextErrors.email = 'Enter a valid email address.';
    }
    if (!password || password.length < 6) {
      nextErrors.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Passwords do not match.';
    }
    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSignup = async () => {
    if (!validate()) {
      return;
    }
    setLoading(true);
    setFormError('');
    try {
      await signup(name.trim(), email.trim(), password);
    } catch (error) {
      setFormError(error.message || 'Unable to signup');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <TextInput
        placeholder="Name"
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (fieldErrors.name) {
            setFieldErrors((prev) => ({ ...prev, name: undefined }));
          }
        }}
        style={[styles.input, fieldErrors.name && styles.inputError]}
      />
      {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}
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
      <View style={[styles.input, styles.passwordRow, fieldErrors.password && styles.inputError]}>
        <TextInput
          placeholder="Password"
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            if (fieldErrors.password) {
              setFieldErrors((prev) => ({ ...prev, password: undefined }));
            }
          }}
          style={styles.passwordInput}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowPassword((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#777" />
        </TouchableOpacity>
      </View>
      {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}
      <View style={[styles.input, styles.passwordRow, fieldErrors.confirmPassword && styles.inputError]}>
        <TextInput
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={(value) => {
            setConfirmPassword(value);
            if (fieldErrors.confirmPassword) {
              setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
            }
          }}
          style={styles.passwordInput}
          secureTextEntry={!showConfirmPassword}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.passwordToggle}
          onPress={() => setShowConfirmPassword((prev) => !prev)}
          accessibilityRole="button"
          accessibilityLabel={showConfirmPassword ? 'Hide password' : 'Show password'}
        >
          <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#777" />
        </TouchableOpacity>
      </View>
      {fieldErrors.confirmPassword ? <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text> : null}
      {formError ? <Text style={styles.formError}>{formError}</Text> : null}
      <TouchableOpacity style={[styles.btn, disabledStyles]} onPress={onSignup} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : null}
        <Text style={styles.btnText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: palette.background, padding: 20, justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: '800', color: palette.text, marginBottom: 20 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  passwordRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 },
  passwordInput: { flex: 1, paddingHorizontal: 8, paddingVertical: 0 },
  passwordToggle: { padding: 8 },
  inputError: { borderColor: '#E74C3C' },
  btn: { backgroundColor: palette.primary, padding: 14, borderRadius: 10, marginBottom: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '700' },
  errorText: { color: '#E74C3C', marginTop: -8, marginBottom: 8, fontSize: 12 },
  formError: { color: '#E74C3C', textAlign: 'center', marginBottom: 12, fontWeight: '600' },
  link: { color: palette.secondary, textAlign: 'center', fontWeight: '700' },
});
