import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { COLORS } from '../utils/constants';

const Button = ({ 
  title, 
  onPress, 
  disabled = false, 
  loading = false, 
  variant = 'primary', 
  style = {},
  textStyle = {} 
}) => {
  const getButtonStyle = () => {
    let buttonStyle = [globalStyles.button];
    
    switch (variant) {
      case 'secondary':
        buttonStyle.push(globalStyles.buttonSecondary);
        break;
      case 'outline':
        buttonStyle.push({
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: COLORS.primary
        });
        break;
      default:
        break;
    }
    
    if (disabled || loading) {
      buttonStyle.push(globalStyles.buttonDisabled);
    }
    
    buttonStyle.push(style);
    return buttonStyle;
  };

  const getTextStyle = () => {
    let textStyleArray = [globalStyles.buttonText];
    
    if (variant === 'secondary') {
      textStyleArray.push(globalStyles.buttonTextSecondary);
    } else if (variant === 'outline') {
      textStyleArray.push({ color: COLORS.primary });
    }
    
    if (disabled || loading) {
      textStyleArray.push({ color: COLORS.textSecondary });
    }
    
    textStyleArray.push(textStyle);
    return textStyleArray;
  };

  const handlePress = () => {
    if (!disabled && !loading && typeof onPress === 'function') {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      onPress={handlePress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'secondary' ? COLORS.primary : COLORS.background} 
          size="small" 
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

export default Button;
