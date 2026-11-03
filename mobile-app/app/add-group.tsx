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
  ActivityIndicator,
  Animated,
  Dimensions,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Plus, X, ArrowLeft, Users, Share2, Copy, ChevronRight, Sparkles, Key
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import * as Clipboard from 'expo-clipboard';
import { apiService } from '@/services/api';
import { subscribeToGroupTopic } from '@/services/notifications';
import { buildInviteQrUrl, buildInviteUrl } from '@/utils/invite';
import { useToast } from '@/components/Toast';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';
import { createLocalId } from '@/utils/id';
import { GroupMember } from '@/types';
import QRCode from 'react-native-qrcode-svg';

const EMOJIS = [
  '🎉', '👫', '✈️', '🏖️', '🍽️', '🏠', '🎂', '🛒', '🧑‍🤝‍🧑', 
  '🧳', '🍻', '🎊', '🚌', '🚗', '🏕️', '🏟️', '🎮', '🎵', 
  '🧗', '🏋️', '🎭', '🎨', '⚽', '🏀', '🎾', '🏐', '🎤',
  '🎸', '🎧', '🎼', '🎲', '🎯', '🎳', '🚴', '🏇', '🏄'
];

export default function AddGroupScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const [groupName, setGroupName] = useState('');
  const [groupEmoji, setGroupEmoji] = useState('🎉');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [members, setMembers] = useState<GroupMember[]>([]);
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
    if (members.some(m => m.name.toLowerCase() === newMember.trim().toLowerCase())) {
      setError('Duplicate member names are not allowed');
      return;
    }
    setMembers([...members, { id: createLocalId(), name: newMember.trim() }]);
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
    const validMembers = members.map(m => m.name.trim()).filter(Boolean);
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
    toast.success('Group invite link copied to clipboard');
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleShareLink = async () => {
    if (!shareableLink) return;
    try {
      await Share.share({
        message: `Join my group on Hisab Barabar: ${shareableLink}`,
        title: 'Join my group on Hisab Barabar',
      });
    } catch (error) {
      toast.error('Failed to share group link');
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
      let validMembers = members.map(m => ({ ...m, name: m.name.trim() })).filter(m => m.name);
      if (currentUserName && !validMembers.some(m => m.name.toLowerCase() === currentUserName.toLowerCase())) {
        validMembers = [{ id: createLocalId(), name: currentUserName }, ...validMembers];
      }
      const groupPayload = {
        name: groupName.trim(),
        description: '',
        members: validMembers,
        emoji: groupEmoji,
      };
      const createdGroup = await apiService.createGroup(groupPayload);
      setCreatedGroup(createdGroup);
      setShareableLink(buildInviteUrl(createdGroup.id, createdGroup.inviteLink));
      await subscribeToGroupTopic(createdGroup.id);
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
            <View style={styles.successGradient}>
              <View style={styles.successEmojiCircle}>
                <Text style={styles.successEmoji}>{createdGroup.emoji}</Text>
              </View>
              <Text style={styles.successTitle}>Group Created!</Text>
              <Text style={styles.successGroupName}>{createdGroup.name}</Text>
            </View>
            
            <View style={styles.successContent}>
              {createdGroup.members.length > 0 && (
                <View style={styles.successMembersContainer}>
                  <Text style={styles.successMembersTitle}>MEMBERS</Text>
                  <View style={styles.successMembersList}>
                    {createdGroup.members.map((member: GroupMember, index: number) => (
                      <View key={index} style={styles.successMemberPill}>
                        <Users size={14} color={COLORS.text} />
                        <Text style={styles.successMemberText}>{member.name}</Text>
                        {member.name === currentUserName && (
                          <View style={styles.youBadge}>
                            <Text style={styles.youBadgeText}>You</Text>
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                </View>
              )}
              
              {shareableLink && (
                <View style={styles.successQrContainer}>
                  <View
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel={`Invite QR code for ${createdGroup.name}`}
                  >
                    <QRCode value={buildInviteQrUrl(createdGroup.id)} size={180} color="#000000" backgroundColor="#ffffff" />
                  </View>
                  <Text style={styles.successQrCaption}>Scan to open this group invite</Text>
                </View>
              )}
              <Text style={styles.successSubtitle}>Share invite link with friends:</Text>
              <View style={styles.successLinkBox}>
                <Text style={styles.successLinkText} numberOfLines={1}>{shareableLink}</Text>
                <TouchableOpacity onPress={handleCopyLink} style={styles.copyButton} accessibilityRole="button" accessibilityLabel="Copy invite link">
                  <Copy size={18} color={COLORS.text} />
                </TouchableOpacity>
              </View>
              
              <TouchableOpacity 
                style={styles.successShareBtn} 
                onPress={handleShareLink}
                activeOpacity={0.8}
              >
                <Share2 size={20} color={COLORS.text} />
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
                  <ChevronRight size={20} color={COLORS.actionText} />
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
        <View style={styles.headerGradient}>
          <View style={styles.topBar}>
            <TouchableOpacity style={styles.backButton} onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
              <ArrowLeft size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.topBarTitle}>Create Group</Text>
            <View style={{ width: 40 }} />
          </View>
        </View>

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
                  placeholderTextColor={COLORS.textTertiary}
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
                    <Text style={styles.chipText}>{member.name}</Text>
                    <TouchableOpacity style={styles.chipRemove} onPress={() => removeMember(idx)} accessibilityRole="button" accessibilityLabel={`Remove ${member.name}`}>
                      <X size={14} color={COLORS.negative} />
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={styles.addMemberContainer}>
                  <TextInput
                    style={styles.chipInput}
                    value={newMember}
                    onChangeText={setNewMember}
                    placeholder={members.length === 0 ? 'Add member' : ''}
                    placeholderTextColor={COLORS.textTertiary}
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
                    accessibilityRole="button"
                    accessibilityLabel="Add member"
                  >
                    <Plus size={18} color={newMember.trim() ? COLORS.action : COLORS.textTertiary} />
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
            <Sparkles size={16} color={COLORS.action} />
            <Text style={styles.tipText}>You can add more members later from group settings</Text>
          </View>
        </ScrollView>
        
        <View style={styles.bottomButtonsContainer}>
          <TouchableOpacity
            style={[styles.joinByCodeButton, { width: buttonWidth }]}
            onPress={handleJoinByCode}
            activeOpacity={0.8}
          >
            <Key size={20} color={COLORS.actionText} style={{ marginRight: 8 }} />
            <Text style={styles.joinByCodeButtonText}>Join by Code</Text>
          </TouchableOpacity>

          <Animated.View style={[styles.createButtonContainer, { transform: [{ scale: scaleAnim }], width: buttonWidth }]}> 
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateGroup}
              disabled={!groupName.trim() || groupName.trim().length < 3 || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.actionText} size="small" />
              ) : (
                <>
                  <Plus size={20} color={COLORS.actionText} style={{ marginRight: 8 }} />
                  <Text style={styles.createButtonText}>Create Group</Text>
                </>
              )}
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
                accessibilityRole="button"
                accessibilityLabel="Close emoji picker"
              >
                <X size={24} color={COLORS.textTertiary} />
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

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
    backgroundColor: COLORS.surfaceSecondary,
  },
  topBarTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
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
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  editEmojiBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: COLORS.action,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editEmojiText: {
    color: COLORS.actionText,
    fontSize: 12,
    fontWeight: '600',
  },
  emojiText: {
    fontSize: 48,
  },
  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '92%',
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 24,
  },
  floatingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 8,
    marginLeft: 4,
  },
  optionalText: {
    color: COLORS.textTertiary,
    fontWeight: 'normal',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  inputFocused: {
    borderColor: COLORS.action,
  },
  input: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  inputError: {
    borderColor: COLORS.negative,
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
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  currentUserChip: {
    backgroundColor: COLORS.surfaceSecondary,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.text,
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
    color: COLORS.text,
    paddingVertical: 0,
    paddingHorizontal: 4,
  },
  addChipBtn: {
    padding: 4,
    marginLeft: 4,
  },
  youBadge: {
    backgroundColor: COLORS.action,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 6,
  },
  youBadgeText: {
    color: COLORS.actionText,
    fontSize: 10,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: COLORS.negative,
  },
  errorText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.negative,
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
    borderRadius: 999,
    backgroundColor: COLORS.action,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 18,
  },
  joinByCodeButtonText: {
    color: COLORS.actionText,
    fontWeight: '600',
    fontSize: 16,
  },
  createButtonContainer: {
    borderRadius: 999,
  },
  createButton: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: COLORS.action,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingVertical: 18,
  },
  createButtonText: {
    color: COLORS.actionText,
    fontWeight: '600',
    fontSize: 16,
  },
  tipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 16,
    marginHorizontal: 24,
    gap: 8,
  },
  tipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    flex: 1,
  },
  // Success Modal
  successModalBg: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  successModalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.06,
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
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successEmoji: {
    fontSize: 40,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  successGroupName: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
  },
  successMembersContainer: {
    width: '100%',
    marginBottom: 24,
  },
  successMembersTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textTertiary,
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
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  successMemberText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  successSubtitle: {
    fontSize: 15,
    fontWeight: '500',
    color: COLORS.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
  },
  successQrContainer: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 24,
  },
  successQrCaption: {
    color: COLORS.textTertiary,
    fontSize: 14,
    textAlign: 'center',
  },
  successLinkBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  successLinkText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
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
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 24,
  },
  successShareBtnText: {
    color: COLORS.text,
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
    backgroundColor: COLORS.action,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    flexDirection: 'row',
    gap: 8,
  },
  successActionPrimaryText: {
    color: COLORS.actionText,
    fontWeight: '600',
    fontSize: 16,
  },
  successActionSecondary: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
  },
  successActionSecondaryText: {
    color: COLORS.text,
    fontWeight: '600',
    fontSize: 16,
  },
  // Emoji Picker
  emojiPickerContainer: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'flex-end',
  },
  emojiPickerSheet: {
    backgroundColor: COLORS.card,
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
    color: COLORS.text,
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
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 2,
    borderColor: COLORS.action,
  },
  emojiOptionText: {
    fontSize: 28,
  },
});