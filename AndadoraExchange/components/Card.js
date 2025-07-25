import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { globalStyles } from '../styles/globalStyles';
import { SPACING } from '../utils/constants';

const Card = ({ 
  children, 
  style = {}, 
  onPress = null, 
  padding = SPACING.md,
  margin = SPACING.sm 
}) => {
  const cardStyle = [
    globalStyles.card,
    {
      padding,
      marginVertical: margin
    },
    style
  ];

  if (onPress && typeof onPress === 'function') {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {children}
    </View>
  );
};

export default Card;
