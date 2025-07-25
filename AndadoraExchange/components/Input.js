import React, { useState } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING } from '../utils/constants';

const Input = ({
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  error = null,
  label = null,
  style = {},
  inputStyle = {},
  multiline = false,
  numberOfLines = 1,
  editable = true,
  maxLength = null,
  onFocus = null,
  onBlur = null
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const getInputStyle = () => {
    let inputStyleArray = [globalStyles.input];
    
    if (isFocused) {
      inputStyleArray.push(globalStyles.inputFocused);
    }
    
    if (error) {
      inputStyleArray.push(globalStyles.inputError);
    }
    
    if (!editable) {
      inputStyleArray.push({
        backgroundColor: COLORS.surface,
        color: COLORS.textSecondary
      });
    }
    
    inputStyleArray.push(inputStyle);
    return inputStyleArray;
  };

  const handleFocus = () => {
    setIsFocused(true);
    if (onFocus) onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (onBlur) onBlur();
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <View style={[{ marginBottom: SPACING.sm }, style]}>
      {label && (
        <Text style={[globalStyles.caption, { marginBottom: SPACING.xs, fontWeight: '600' }]}>
          {label}
        </Text>
      )}
      
      <View style={{ position: 'relative' }}>
        <TextInput
          style={getInputStyle()}
          placeholder={placeholder}
          placeholderTextColor={COLORS.placeholder}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={handleFocus}
          onBlur={handleBlur}
          multiline={multiline}
          numberOfLines={numberOfLines}
          editable={editable}
          maxLength={maxLength}
          autoCorrect={false}
          spellCheck={false}
        />
        
        {secureTextEntry && (
          <TouchableOpacity
            style={{
              position: 'absolute',
              right: SPACING.md,
              top: SPACING.md,
              padding: SPACING.xs
            }}
            onPress={togglePasswordVisibility}
          >
            <Text style={{ color: COLORS.textSecondary, fontSize: 12 }}>
              {showPassword ? 'HIDE' : 'SHOW'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
      
      {error && (
        <Text style={globalStyles.errorText}>{error}</Text>
      )}
    </View>
  );
};

export default Input;
