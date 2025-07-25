import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { COLORS, SPACING } from '../utils/constants';

const ErrorMessage = ({ 
  message, 
  onDismiss = null, 
  style = {},
  showDismiss = false,
  type = 'error' // 'error', 'warning', 'info', 'success'
}) => {
  if (!message) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'warning':
        return COLORS.warning;
      case 'info':
        return COLORS.accent;
      case 'success':
        return COLORS.success;
      default:
        return COLORS.error;
    }
  };

  const getTextColor = () => {
    return type === 'info' ? COLORS.background : COLORS.background;
  };

  const containerStyle = [
    {
      backgroundColor: getBackgroundColor(),
      padding: SPACING.md,
      borderRadius: 8,
      marginVertical: SPACING.sm,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    style
  ];

  return (
    <View style={containerStyle}>
      <Text 
        style={[
          globalStyles.body,
          { 
            color: getTextColor(),
            flex: 1,
            fontSize: 14
          }
        ]}
      >
        {message}
      </Text>
      
      {(showDismiss || onDismiss) && (
        <TouchableOpacity
          onPress={onDismiss}
          style={{
            marginLeft: SPACING.sm,
            padding: SPACING.xs
          }}
        >
          <Text 
            style={{
              color: getTextColor(),
              fontSize: 16,
              fontWeight: 'bold'
            }}
          >
            ×
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default ErrorMessage;
