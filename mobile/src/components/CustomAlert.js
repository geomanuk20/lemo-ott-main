import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TouchableWithoutFeedback
} from 'react-native';

export default function CustomAlert({ visible, title, message, buttons = [], onClose }) {
  // Safe fallback if no buttons are provided
  const activeButtons = buttons && buttons.length > 0
    ? buttons
    : [{ text: 'OK', onPress: onClose }];

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.alertBox}>
              {/* Title & Message */}
              <Text style={styles.title}>{title}</Text>
              <Text style={styles.message}>{message}</Text>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                {activeButtons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel' || btn.text.toLowerCase() === 'cancel';
                  return (
                    <TouchableOpacity
                      key={idx}
                      activeOpacity={0.8}
                      style={[
                        styles.button,
                        isCancel ? styles.cancelButton : styles.primaryButton,
                        activeButtons.length > 1 ? { flex: 1 } : { width: '100%' }
                      ]}
                      onPress={() => {
                        onClose();
                        if (btn.onPress) {
                          btn.onPress();
                        }
                      }}
                    >
                      <Text style={[
                        styles.buttonText,
                        isCancel ? styles.cancelButtonText : styles.primaryButtonText
                      ]}>
                        {btn.text}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  alertBox: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#0c0c0e',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.58,
    shadowRadius: 16.0,
    elevation: 24,
  },
  title: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 10,
  },
  message: {
    color: '#a0a0a5',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#b3d332',
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#3a3a3c',
  },
  cancelButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonText: {
    textAlign: 'center',
  },
});
