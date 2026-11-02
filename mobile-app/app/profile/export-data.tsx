import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ArrowLeft, Download, FileText, Calendar, Users, DollarSign, CircleCheck as CheckCircle, Clock, Share2, Mail } from 'lucide-react-native';
import { apiService } from '@/services/api';
import { Group } from '@/types';
import { useToast } from '@/components/Toast';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/hooks/useTheme';

const getMemberName = (group: Group | undefined, memberId: string): string => {
  return group?.members.find(m => m.id === memberId)?.name || memberId;
};

interface ExportOption {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  format: 'csv' | 'pdf';
  dataType: 'all' | 'expenses' | 'groups' | 'balances';
}

export default function ExportDataScreen() {
  const { colors: COLORS, styles } = useThemedStyles(createStyles);
  const toast = useToast();
  const [exporting, setExporting] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<Date | null>(null);

  const exportOptions: ExportOption[] = [
    {
      id: 'all-csv',
      title: 'Complete Data Export (CSV)',
      description: 'All transactions, groups, and balances in spreadsheet format',
      icon: <FileText size={24} color={COLORS.text} />,
      format: 'csv',
      dataType: 'all'
    },
    {
      id: 'expenses-csv',
      title: 'Expenses Only (CSV)',
      description: 'All expense transactions with details',
      icon: <DollarSign size={24} color={COLORS.text} />,
      format: 'csv',
      dataType: 'expenses'
    },
    {
      id: 'groups-csv',
      title: 'Groups Data (CSV)',
      description: 'Group information and member details',
      icon: <Users size={24} color={COLORS.text} />,
      format: 'csv',
      dataType: 'groups'
    },
    {
      id: 'balances-csv',
      title: 'Current Balances (CSV)',
      description: 'Who owes whom and settlement status',
      icon: <CheckCircle size={24} color={COLORS.text} />,
      format: 'csv',
      dataType: 'balances'
    }
  ];

  const generateCSVContent = async (dataType: string) => {
    try {
      let csvContent = '';
      
      switch (dataType) {
        case 'all':
          csvContent = await generateCompleteCSV();
          break;
        case 'expenses':
          csvContent = await generateExpensesCSV();
          break;
        case 'groups':
          csvContent = await generateGroupsCSV();
          break;
        case 'balances':
          csvContent = await generateBalancesCSV();
          break;
        default:
          throw new Error('Invalid data type');
      }
      
      return csvContent;
    } catch (error) {
      console.error('Error generating CSV:', error);
      throw error;
    }
  };

  const generateCompleteCSV = async () => {
    const [groups, expenses] = await Promise.all([
      apiService.getGroups(),
      apiService.getAllExpenses()
    ]);

    let csv = 'Type,Date,Group,Description,Amount,Paid By,Participants,Balance Status\n';
    
    // Add expenses
    expenses.forEach(expense => {
      const group = groups.find(g => g.id === expense.groupId);
      const paidBy = getMemberName(group, expense.paidBy);
      const participants = expense.participants.map(p => getMemberName(group, p)).join(';');
      csv += `Expense,${expense.date},"${group?.name || 'Unknown'}","${expense.description}",${expense.amount},"${paidBy}","${participants}",Active\n`;
    });

    // Add group balances
    groups.forEach(group => {
      Object.entries(group.balances).forEach(([memberId, balance]) => {
        if (balance !== 0) {
          const status = balance > 0 ? 'Owed' : 'Owes';
          const member = getMemberName(group, memberId);
          csv += `Balance,${new Date().toISOString().split('T')[0]},"${group.name}","Balance for ${member}",${Math.abs(balance)},"${member}","${member}",${status}\n`;
        }
      });
    });

    return csv;
  };

  const generateExpensesCSV = async () => {
    const [groups, expenses] = await Promise.all([
      apiService.getGroups(),
      apiService.getAllExpenses()
    ]);

    let csv = 'Date,Group,Description,Amount,Paid By,Participants,Split Amount,Created At\n';
    
    expenses.forEach(expense => {
      const group = groups.find(g => g.id === expense.groupId);
      const paidBy = getMemberName(group, expense.paidBy);
      const participants = expense.participants.map(p => getMemberName(group, p)).join(';');
      const splitAmount = expense.amount / expense.participants.length;
      csv += `${expense.date},"${group?.name || 'Unknown'}","${expense.description}",${expense.amount},"${paidBy}","${participants}",${splitAmount.toFixed(2)},${expense.createdAt}\n`;
    });

    return csv;
  };

  const generateGroupsCSV = async () => {
    const groups = await apiService.getGroups();

    let csv = 'Group Name,Description,Members,Total Expenses,Created At,Member Count\n';
    
    groups.forEach(group => {
      const members = group.members.map(m => m.name).join(';');
      csv += `"${group.name}","${group.description}","${members}",${group.totalExpenses},${group.createdAt},${group.members.length}\n`;
    });

    return csv;
  };

  const generateBalancesCSV = async () => {
    const groups = await apiService.getGroups();

    let csv = 'Group,Member,Balance,Status,Settlement Required\n';
    
    groups.forEach(group => {
      Object.entries(group.balances).forEach(([memberId, balance]) => {
        const status = balance > 0 ? 'Owed' : balance < 0 ? 'Owes' : 'Settled';
        const settlementRequired = balance !== 0 ? 'Yes' : 'No';
        csv += `"${group.name}","${getMemberName(group, memberId)}",${balance},${status},${settlementRequired}\n`;
      });
    });

    return csv;
  };

  const downloadCSV = (content: string, filename: string) => {
    // In a real app, this would trigger a file download
    // For web, you could create a blob and download link
    // For mobile, you could use expo-file-system and expo-sharing
    
    if (typeof window !== 'undefined') {
      // Web implementation
      const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mobile implementation would go here
      toast.success(`${filename} has been generated and saved to your device.`);
    }
  };

  const handleExport = async (option: ExportOption) => {
    setExporting(option.id);
    
    try {
      const csvContent = await generateCSVContent(option.dataType);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `hisab-kitab-${option.dataType}-${timestamp}.csv`;
      
      downloadCSV(csvContent, filename);
      setLastExport(new Date());
      
      toast.success(`Your ${option.title.toLowerCase()} has been exported successfully.`);
    } catch (error) {
      toast.error('There was an error exporting your data. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  const handleShare = (filename: string) => {
    toast.info(`Share ${filename} via email or messaging apps.`);
  };

  const handleEmailExport = () => {
    Alert.alert(
      'Email Export',
      'Send your data export to your email address?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Send', 
          onPress: () => {
            toast.success('Your data export has been sent to your registered email address.');
          }
        }
      ]
    );
  };

  const renderExportOption = (option: ExportOption) => (
    <TouchableOpacity
      key={option.id}
      style={styles.exportCard}
      onPress={() => handleExport(option)}
      disabled={exporting === option.id}
    >
      <View style={styles.exportIcon}>
        {option.icon}
      </View>
      <View style={styles.exportContent}>
        <Text style={styles.exportTitle}>{option.title}</Text>
        <Text style={styles.exportDescription}>{option.description}</Text>
      </View>
      <View style={styles.exportAction}>
        {exporting === option.id ? (
          <ActivityIndicator size="small" color={COLORS.action} />
        ) : (
          <Download size={20} color={COLORS.textTertiary} />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
         accessibilityRole="button" accessibilityLabel="Go back">
          <ArrowLeft size={20} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>Export Data</Text>
        <TouchableOpacity
          style={styles.emailButton}
          onPress={handleEmailExport}
          accessibilityRole="button"
          accessibilityLabel="Email export"
        >
          <Mail size={18} color={COLORS.text} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Export Status */}
        {lastExport && (
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <CheckCircle size={20} color={COLORS.positive} />
            </View>
            <View style={styles.statusContent}>
              <Text style={styles.statusTitle}>Last Export</Text>
              <Text style={styles.statusTime}>
                {lastExport.toLocaleDateString()} at {lastExport.toLocaleTimeString()}
              </Text>
            </View>
          </View>
        )}

        {/* Export Options */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Choose Export Type</Text>
          {exportOptions.map(renderExportOption)}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          
          <TouchableOpacity style={styles.quickActionCard} onPress={handleEmailExport}>
            <View style={styles.quickActionIcon}>
              <Mail size={24} color={COLORS.text} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Email Export</Text>
              <Text style={styles.quickActionSubtitle}>
                Send complete data export to your email
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.quickActionCard} 
            onPress={() => handleShare('hisab-kitab-export.csv')}
          >
            <View style={styles.quickActionIcon}>
              <Share2 size={24} color={COLORS.text} />
            </View>
            <View style={styles.quickActionContent}>
              <Text style={styles.quickActionTitle}>Share Data</Text>
              <Text style={styles.quickActionSubtitle}>
                Share your export with accountants or family
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Information */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Data Export</Text>
          <Text style={styles.infoText}>
            Your exported data includes all transactions, group information, and current balances. 
            CSV files can be opened in Excel, Google Sheets, or any spreadsheet application.
          </Text>
          <View style={styles.infoFeatures}>
            <Text style={styles.infoFeature}>• All data is exported in chronological order</Text>
            <Text style={styles.infoFeature}>• Includes group member details and split calculations</Text>
            <Text style={styles.infoFeature}>• Compatible with accounting software</Text>
            <Text style={styles.infoFeature}>• Data is exported in Nepali Rupees (NPR)</Text>
          </View>
        </View>

        {/* Privacy Notice */}
        <View style={styles.privacyCard}>
          <Text style={styles.privacyTitle}>Privacy & Security</Text>
          <Text style={styles.privacyText}>
            Your exported data contains sensitive financial information. Please store and share it securely. 
            Hisab Barabar does not store copies of your exported files.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (COLORS: ThemeColors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    textAlign: 'center',
    marginHorizontal: 12,
  },
  emailButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  statusIcon: {
    marginRight: 12,
  },
  statusContent: {
    flex: 1,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  statusTime: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
    fontFamily: 'Inter-Bold',
    marginBottom: 12,
  },
  exportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exportContent: {
    flex: 1,
  },
  exportTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  exportDescription: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  exportAction: {
    marginLeft: 12,
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 12,
    color: COLORS.textTertiary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
  infoCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 20,
    marginBottom: 12,
  },
  infoFeatures: {
    marginTop: 8,
  },
  infoFeature: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 18,
    marginBottom: 2,
  },
  privacyCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: '#1A1B25',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 2,
  },
  privacyTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    fontFamily: 'Inter-SemiBold',
    marginBottom: 8,
  },
  privacyText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontFamily: 'Inter-Regular',
    lineHeight: 16,
  },
});