import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Modal as RNModal,
  FlatList,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Plus, X, ArrowLeft, Users, Share2, Copy, ChevronRight, Sparkles, Key
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { apiService } from '@/services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

const EMOJIS = [
  '🎉', '👫', '✈️', '🏖️', '🍽️', '🏠', '🎂', '🛒', '🧑‍🤝‍🧑', 
  '🧳', '🍻', '🎊', '🚌', '🚗', '🏕️', '🏟️', '🎮', '🎵', 
  '🧗', '🏋️', '🎭', '🎨', '⚽', '🏀', '🎾', '🏐', '🎤',
  '🎸', '🎧', '🎼', '🎲', '🎯', '🎳', '🚴', '🏇', '🏄'
];

export default function AddGroupScreen() {
  const [groupName, setGroupName] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('🎉');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [members, setMembers] = useState<string[]>([]);
  const [newMember, setNewMember] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdGroup, setCreatedGroup] = useState<any>(null);
  const [shareableLink, setShareableLink] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentUserName, setCurrentUserName] = useState<string>('');
  const confettiRef = useRef<any>(null);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isFocused, setIsFocused] = useState(false);

  const { width } = Dimensions.get('window');
  const buttonWidth = (width - 48) / 2 - 8;

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const user = await apiService.getUserProfile();
        setCurrentUserName(user.name);
      } catch (err) {
        setCurrentUserName('');
      }
    };
    fetchUser();
  }, []);

  const addMember = () => {
    if (!newMember.trim()) return;
    if (members.some(m => m.toLowerCase() === newMember.trim().toLowerCase())) {
      setError('Duplicate member names are not allowed');
      return;
    }
    setMembers([...members, newMember.trim()]);
    setNewMember('');
    setError(null);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const removeMember = (index: number) => {
    const newMembers = [...members];
    newMembers.splice(index, 1);
    setMembers(newMembers);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const validate = () => {
    if (!groupName.trim() || groupName.trim().length < 3) {
      setError('Group name must be at least 3 characters');
      return false;
    }
    const validMembers = members.map(m => m.trim()).filter(Boolean);
    const memberSet = new Set();
    for (let m of validMembers) {
      if (memberSet.has(m.toLowerCase())) {
        setError('Duplicate member names are not allowed');
        return false;
      }
      memberSet.add(m.toLowerCase());
    }
    setError(null);
    return true;
  };

  const handleCopyLink = async () => {
    if (!shareableLink) return;
    await Clipboard.setStringAsync(shareableLink);
    Alert.alert('Copied!', 'Group invite link copied to clipboard');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShareLink = async () => {
    if (!shareableLink) return;
    try {
      await Sharing.shareAsync(shareableLink, {
        dialogTitle: 'Join my group on SplitSaathi',
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share group link');
    }
  };

  const handleCreateGroup = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      })
    ]).start();
    setLoading(true);
    setError(null);
    try {
      let validMembers = members.map(m => m.trim()).filter(Boolean);
      if (currentUserName && !validMembers.some(m => m.toLowerCase() === currentUserName.toLowerCase())) {
        validMembers = [currentUserName, ...validMembers];
      }
      const groupPayload = {
        name: groupName.trim(),
        description: '',
        members: validMembers,
        emoji: groupEmoji,
      };
      const createdGroup = await apiService.createGroup(groupPayload);
      setCreatedGroup(createdGroup);
      setShareableLink(createdGroup.inviteLink || null);
      setSuccess(true);
      setTimeout(() => confettiRef.current?.start(), 400);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      setError(error?.message || 'Failed to create group. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setGroupName('');
    setMembers([]);
    setNewMember('');
    setSuccess(false);
    setCreatedGroup(null);
    setShareableLink(null);
    setError(null);
  };

  const handleJoinByCode = () => {
    router.push('/joingroupbycode');
  };

  if (success && createdGroup) {
    return (
      <RNModal visible={success} animationType="fade" transparent>
        <View style={styles.successModalBg}>
          <ConfettiCannon
            count={200}
            origin={{x: -10, y: 0}}
            autoStart={false}
            ref={confettiRef}
            fadeOut
            explosionSpeed={500}
          />
          <View style={styles.successModalCard}>
            <LinearGradient
              colors={['#7C3AED', '#5B21B6']}
              style={styles.successGradient}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
            >
              <View style={styles.successEmojiCircle}>
                <Text style={styles.successEmoji}>{createdGroup.emoji}</Text>
              </View>
              <Text style={styles.successTitle}>Group Created!</Text>
              <Text style={styles.successGroupName}>{createdGroup.name}</Text>
            </LinearGradient>
            
            <View style={styles.successContent}>
              {createdGroup.members.length > 0 && (
                <View style={styles.successMembersContainer}>
                  <Text style={styles.successMembersTitle}>MEMBERS</Text>
                  <View style={styles.successMembersList}>
                    {createdGroup.members.map((member: string, index: number) => (
                      <View key={index} style={styles.successMemberPill}>
                        <Users size={14} color="#6366F1" />
                        <Text style={styles.successMemberText}>{member}</Text>
                        {member === currentUserName && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>You</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              <Text style={styles.successSubtitle}>Share invite link with friends:</Text>
              <View style={styles.successLinkBox}>
                <Text style={styles.successLinkText} numberOfLines={1}>{shareableLink}</Text>
                <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton}>
                  <Copy size={18} color="#6366F1" />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.successShareBtn} 
                onPress={handleShareLink}
                activeOpacity={0.8}
              >
                <Share2 size={20} color="#6366F1" />
                <Text style={styles.successShareBtnText}>Share Invite</Text>
              </TouchableOpacity>
              
              <View style={styles.successActionsRow}>
                <TouchableOpacity 
                  style={styles.successActionSecondary} 
                  onPress={resetForm}
                  activeOpacity={0.7}
                >
                  <Text style={styles.successActionSecondaryText}>New Group</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.successActionPrimary} 
                  onPress={() => router.replace(`/group/${createdGroup.id}`)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.successActionPrimaryText}>Go to Group</Text>
                  <ChevronRight size={20} color="#fff" />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </RNModal>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={styles.keyboardAvoidingView}
        keyboardVerticalOffset={80}
      >
        <LinearGradient
          colors={['#7C3AED', '#5B21B6']}
          style={styles.headerGradient}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
        >
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Create Group</Text>
            <View style={{ width: 40 }} />
          </View>
        </LinearGradient>

        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TouchableOpacity 
            style={styles.emojiCircle} 
            onPress={() => setShowEmojiPicker(true)} 
            activeOpacity={0.8}
          >
            <Text style={styles.emojiText}>{groupEmoji}</Text>
            <View style={styles.editEmojiBadge}>
              <Text style={styles.editEmojiText}>Edit</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.floatingLabel}>Group Name</Text>
              <View style={[
                styles.inputWrapper, 
                error && groupName.trim().length < 3 && styles.inputError,
                isFocused && styles.inputFocused
              ]}>
                <TextInput
                  style={styles.input}
                  value={groupName}
                  onChangeText={setGroupName}
                  placeholder="e.g. Vacation, Roommates, etc."
                  placeholderTextColor="#94A3B8"
                  maxLength={32}
                  autoCapitalize="words"
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.floatingLabel}>
                Members <Text style={styles.optionalText}>(Optional)</Text>
              </Text>
              
              {currentUserName && (
                <View style={[styles.chip, styles.currentUserChip]}>
                  <Text style={styles.chipText}>{currentUserName}</Text>
                  <View style={styles.youBadge}>
                    <Text style={styles.youBadgeText}>You</Text>
                  </View>
                </View>
              )}
              
              <View style={styles.chipRow}>
                {members.map((member, idx) => (
                  <View key={idx} style={styles.chip}>
                    <Text style={styles.chipText}>{member}</Text>
                    <TouchableOpacity style={styles.chipRemove} onPress={() => removeMember(idx)}>
                      <X size={14} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={styles.addMemberContainer}>
                  <TextInput
                    style={styles.chipInput}
                    value={newMember}
                    onChangeText={setNewMember}
                    placeholder={members.length === 0 ? 'Add member' : ''}
                    placeholderTextColor="#94A3B8"
                    maxLength={18}
                    autoCapitalize="words"
                    onSubmitEditing={addMember}
                    returnKeyType="done"
                  />
                  <TouchableOpacity 
                    style={styles.addChipBtn} 
                    onPress={addMember} 
                    activeOpacity={0.7}
                    disabled={!newMember.trim()}
                  >
                    <Plus size={18} color={newMember.trim() ? "#7C3AED" : "#CBD5E1"} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
          
          <View style={styles.tipContainer}>
            <Sparkles size={16} color="#7C3AED" />
            <Text style={styles.tipText}>You can add more members later from group settings</Text>
          </View>
        </ScrollView>
        
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.joinByCodeButton, { width: buttonWidth }]}
            onPress={handleJoinByCode}
            activeOpacity={0.8}
          >
            <LinearGradient 
              colors={["#8B5CF6", "#7C3AED"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.joinByCodeButtonGradient}
            >
              <Key size={20} color="#fff" style={{ marginRight: 8 }} />
              <Text style={styles.joinByCodeButtonText}>Join by Code</Text>
            </LinearGradient>
          </TouchableOpacity>

          <Animated.View style={[styles.createButtonContainer, { transform: [{ scale: scaleAnim }], width: buttonWidth }]}> 
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || groupName.trim().length < 3 || loading}
              activeOpacity={0.8}
            >
              <LinearGradient 
                colors={["#10B981", "#059669"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.createButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Plus size={20} color="#fff" style={{ marginRight: 8 }} />
                    <Text style={styles.createButtonText}>Create Group</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
      
      <RNModal 
        visible={showEmojiPicker} 
        animationType="slide" 
        transparent
        onRequestClose={() => setShowEmojiPicker(false)}
      >
        <View style={styles.emojiPickerContainer}>
          <View style={styles.emojiPickerSheet}>
            <View style={styles.emojiPickerHeader}>
              <Text style={styles.emojiPickerTitle}>Select Group Emoji</Text>
              <TouchableOpacity 
                style={styles.emojiPickerCloseButton}
                onPress={() => setShowEmojiPicker(false)}
              >
                <X size={24} color="#64748B" />
              </TouchableOpacity>
            </View>
            
            <FlatList
              data={EMOJIS}
              numColumns={7}
              keyExtractor={(item, index) => item + index}
              renderItem={({item}) => (
                <TouchableOpacity
                  style={[styles.emojiOption, groupEmoji === item && styles.emojiOptionSelected]}
                  onPress={() => { 
                    setGroupEmoji(item); 
                    setShowEmojiPicker(false); 
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  }}
                >
                  <Text style={styles.emojiOptionText}>{item}</Text>
                </TouchableOpacity>
              )}
              contentContainerStyle={styles.emojiList}
            />
          </View>
        </View>
      </RNModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 24,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 120,
    alignItems: 'center',
    paddingTop: 16,
  },
  emojiCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 3,
    borderColor: '#EDE9FE',
  },
  editEmojiBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: '#7C3AED',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editEmojiText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  emojiText: {
    fontSize: 48,
  },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    width: '92%',
    padding: 24,
    shadowColor: '#7C3AED',
    shadowOpacity: 0.1,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  floatingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C3AED',
    marginBottom: 8,
    marginLeft: 4,
  },
  optionalText: {
    color: '#94A3B8',
    fontWeight: 'normal',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputFocused: {
    borderColor: '#7C3AED',
    backgroundColor: '#F5F3FF',
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#1E293B',
  },
  inputError: {
    borderColor: '#EF4444',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
    minHeight: 40,
  },
  addMemberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EDE9FE',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  currentUserChip: {
    backgroundColor: '#DBEAFE',
    marginBottom: 8,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5B21B6',
    marginRight: 4,
  },
  chipRemove: {
    marginLeft: 4,
    padding: 2,
  },
  chipInput: {
    minWidth: 100,
    fontSize: 15,
    fontWeight: '500',
    color: '#1E293B',
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  addChipBtn: {
    padding: 4,
    marginLeft: 4,
  },
  youBadge: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  youBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#EF4444',
    textAlign: 'center',
  },
  bottomButtonsContainer: {
    position: 'absolute',
    left: 24,
    right: 24,
    bottom: 32,
    flexDirection: 'row',
    gap: 16,
  },
  joinByCodeButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#7C3AED',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  joinByCodeButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  joinByCodeButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  createButtonContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
  },
  createButton: {
    width: '100%',
  },
  createButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F5F3FF',
    borderRadius: 16,
    marginHorizontal: 24,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5B21B6',
    flex: 1,
  },
  // Success Modal
  successModalBg: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    backgroundColor: '#fff',
    borderRadius: 32,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  successGradient: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successContent: {
    padding: 24,
  },
  successEmojiCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#EDE9FE',
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  successGroupName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  successMembersContainer: {
    width: '100%',
    marginBottom: 24,
  },
  successMembersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
    letterSpacing: 1,
  },
  successMembersList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  successMemberPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F3FF',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  successMemberText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#5B21B6',
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 16,
  },
  successLinkBox: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  successLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#7C3AED',
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  successShareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EDE9FE',
    marginBottom: 24,
  },
  successShareBtnText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 16,
  },
  successActionsRow: {
    flexDirection: 'row',
    width: '100%',
    gap: 16,
  },
  successActionPrimary: {
    flex: 1,
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
  },
  successActionPrimaryText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  successActionSecondary: {
    flex: 1,
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  successActionSecondaryText: {
    color: '#7C3AED',
    fontWeight: '600',
    fontSize: 16,
  },
  // Emoji Picker
  emojiPickerContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  emojiPickerSheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 32,
    maxHeight: '70%',
  },
  emojiPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  emojiPickerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  emojiPickerCloseButton: {
    padding: 4,
  },
  emojiList: {
    alignItems: 'center',
    paddingBottom: 24,
  },
  emojiOption: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
  },
  emojiOptionSelected: {
    backgroundColor: '#EDE9FE',
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  emojiOptionText: {
    fontSize: 28,
  },
});