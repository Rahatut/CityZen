import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, Alert, ScrollView } from 'react-native';
import { ArrowLeft, Calendar, MapPin, CheckCircle, Clock, TrendingUp, AlertCircle, FileText, Download, X } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Navigation from '../components/Navigation';

export default function AuthorityComplaintListScreen({ navigation, route, onLogout, darkMode, toggleDarkMode }) {
    const { statusFilter, title, complaints: initialComplaints } = route.params || {};
    const [complaints, setComplaints] = useState(initialComplaints || []);
    const [filteredComplaints, setFilteredComplaints] = useState(initialComplaints || []);
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        setComplaints(initialComplaints || []);
        setFilteredComplaints(initialComplaints || []);
    }, [initialComplaints]);

    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const currentYearNum = new Date().getFullYear();
    const years = [];
    for (let y = 2025; y <= currentYearNum; y++) {
        years.push(y);
    }

    const StatusBadge = ({ status }) => {
        const s = status ? status.toLowerCase() : '';
        const isResolved = ['resolved', 'closed', 'completed'].includes(s);
        const isPending = s === 'pending';
        const isInProgress = ['in_progress', 'accepted'].includes(s);
        const isAppealed = s === 'appealed';
        const isRejected = s === 'rejected';

        let bg = '#F3F4F6';
        let color = '#374151';
        let text = status ? status.replace('_', ' ').toUpperCase() : '';

        if (isResolved) { bg = '#D1FAE5'; color = '#065F46'; }
        else if (isPending) { bg = '#FEF3C7'; color = '#92400E'; }
        else if (isInProgress) { bg = '#DBEAFE'; color = '#1E40AF'; }
        else if (isAppealed) { bg = '#FAF5FF'; color = '#7E22CE'; }
        else if (isRejected) { bg = '#FEE2E2'; color = '#991B1B'; }

        return (
            <View style={[styles.badge, { backgroundColor: bg }]}>
                <Text style={[styles.badgeText, { color }]}>{text}</Text>
            </View>
        );
    };

    const StatusIcon = ({ status }) => {
        const s = status ? status.toLowerCase() : '';
        if (['resolved', 'closed', 'completed'].includes(s))
            return <CheckCircle size={20} color="#16A34A" />;
        if (s === 'pending')
            return <Clock size={20} color="#EA580C" />;
        if (['in_progress', 'accepted'].includes(s))
            return <TrendingUp size={20} color="#1E88E5" />;
        return <AlertCircle size={20} color="#6B7280" />;
    };

    const filterComplaintsByPeriod = (period) => {
        const now = new Date();
        let filtered = [...complaints];

        if (period === 'week') {
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            filtered = complaints.filter(c => new Date(c.createdAt) >= weekAgo);
        } else if (period === 'month') {
            filtered = complaints.filter(c => {
                const d = new Date(c.createdAt);
                return d.getMonth() === selectedMonth && d.getFullYear() === selectedYear;
            });
        } else if (period === 'year') {
            filtered = complaints.filter(c => {
                const d = new Date(c.createdAt);
                return d.getFullYear() === selectedYear;
            });
        }

        return filtered;
    };

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            const dataToExport = filterComplaintsByPeriod(selectedPeriod);

            const periodLabels = {
                'all': 'All Time',
                'week': 'This Week',
                'month': `Report for ${months[selectedMonth]} ${selectedYear}`,
                'year': `Report for Year ${selectedYear}`
            };

            const htmlContent = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <title>Complaint Report</title>
            <style>
              body {
                font-family: Arial, sans-serif;
                padding: 20px;
                color: #333;
              }
              .header {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #1E88E5;
                padding-bottom: 20px;
              }
              .header h1 {
                color: #1E88E5;
                margin: 0 0 10px 0;
              }
              .header p {
                margin: 5px 0;
                color: #6B7280;
              }
              .summary {
                background-color: #F3F4F6;
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 20px;
              }
              .summary-item {
                display: inline-block;
                margin-right: 30px;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                margin-top: 20px;
              }
              th {
                background-color: #1E88E5;
                color: white;
                padding: 12px;
                text-align: left;
                font-weight: bold;
              }
              td {
                padding: 10px;
                border-bottom: 1px solid #E5E7EB;
              }
              tr:nth-child(even) {
                background-color: #F9FAFB;
              }
              .status-resolved { color: #065F46; font-weight: bold; }
              .status-pending { color: #92400E; font-weight: bold; }
              .status-progress { color: #1E40AF; font-weight: bold; }
              .footer {
                margin-top: 30px;
                text-align: center;
                color: #9CA3AF;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Complaint Analytics Report</h1>
              <p><strong>Report Type:</strong> ${title || 'Complaint List'}</p>
              <p><strong>Time Period:</strong> ${periodLabels[selectedPeriod]}</p>
              <p><strong>Generated:</strong> ${new Date().toLocaleString()}</p>
            </div>
            
            <div class="summary">
              <div class="summary-item"><strong>Total Complaints:</strong> ${dataToExport.length}</div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Title</th>
                  <th>Status</th>
                  <th>Ward</th>
                  <th>Date Submitted</th>
                </tr>
              </thead>
              <tbody>
                ${dataToExport.map(complaint => {
                const status = complaint.currentStatus || 'N/A';
                const statusClass = ['resolved', 'closed', 'completed'].includes(status.toLowerCase()) ? 'status-resolved' :
                    status.toLowerCase() === 'pending' ? 'status-pending' : 'status-progress';
                return `
                    <tr>
                      <td>#${complaint.id}</td>
                      <td>${complaint.title || 'N/A'}</td>
                      <td class="${statusClass}">${status.replace('_', ' ').toUpperCase()}</td>
                      <td>${complaint.ward || 'Unknown'}</td>
                      <td>${new Date(complaint.createdAt).toLocaleDateString()}</td>
                    </tr>
                  `;
            }).join('')}
              </tbody>
            </table>

            <div class="footer">
              <p>CityZen Authority Analytics System</p>
              <p>This is an automatically generated report</p>
            </div>
          </body>
        </html>
      `;

            const { uri } = await Print.printToFileAsync({ html: htmlContent });

            const fileName = `CityZen_${statusFilter || 'Complaints'}_${periodLabels[selectedPeriod].replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

            // Share the PDF
            if (await Sharing.isAvailableAsync()) {
                await Sharing.shareAsync(uri, {
                    UTI: '.pdf',
                    mimeType: 'application/pdf',
                    dialogTitle: fileName
                });
                setShowPDFModal(false);
            } else {
                Alert.alert('Success', `PDF generated successfully!\nLocation: ${uri}`);
                setShowPDFModal(false);
            }
        } catch (error) {
            console.error('PDF Generation Error:', error);
            Alert.alert('Error', 'Failed to generate PDF. Please try again.');
        } finally {
            setIsGenerating(false);
        }
    };

    const renderPDFModal = () => (
        <Modal visible={showPDFModal} transparent animationType="fade" onRequestClose={() => setShowPDFModal(false)}>
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { width: '90%', maxWidth: 500 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>Export Options</Text>
                        <TouchableOpacity onPress={() => setShowPDFModal(false)}>
                            <X size={24} color="#374151" />
                        </TouchableOpacity>
                    </View>

                    <ScrollView showsVerticalScrollIndicator={false}>
                        <Text style={styles.modalLabel}>Select Time Range:</Text>
                        <View style={styles.filterGrid}>
                            {['all', 'week', 'month', 'year'].map(p => (
                                <TouchableOpacity
                                    key={p}
                                    style={[styles.filterChip, selectedPeriod === p && styles.filterChipActive]}
                                    onPress={() => setSelectedPeriod(p)}
                                >
                                    <Text style={[styles.filterChipText, selectedPeriod === p && styles.filterChipTextActive]}>
                                        {p.charAt(0).toUpperCase() + p.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {(selectedPeriod === 'month') && (
                            <View style={styles.selectionSection}>
                                <Text style={styles.modalLabel}>Select Month:</Text>
                                <View style={styles.monthGrid}>
                                    {months.map((m, idx) => (
                                        <TouchableOpacity
                                            key={m}
                                            style={[styles.monthChip, selectedMonth === idx && styles.monthChipActive]}
                                            onPress={() => setSelectedMonth(idx)}
                                        >
                                            <Text style={[styles.monthChipText, selectedMonth === idx && styles.monthChipTextActive]}>
                                                {m.substring(0, 3)}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        {(selectedPeriod === 'month' || selectedPeriod === 'year') && (
                            <View style={styles.selectionSection}>
                                <Text style={styles.modalLabel}>Select Year:</Text>
                                <View style={styles.filterGrid}>
                                    {years.map(y => (
                                        <TouchableOpacity
                                            key={y}
                                            style={[styles.filterChip, selectedYear === y && styles.filterChipActive]}
                                            onPress={() => setSelectedYear(y)}
                                        >
                                            <Text style={[styles.filterChipText, selectedYear === y && styles.filterChipTextActive]}>
                                                {y}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[styles.generateButton, { marginTop: 20 }]}
                            onPress={generatePDF}
                            disabled={isGenerating}
                        >
                            {isGenerating ? (
                                <ActivityIndicator color="white" />
                            ) : (
                                <>
                                    <Download size={20} color="white" />
                                    <Text style={styles.generateButtonText}>Generate PDF Report</Text>
                                </>
                            )}
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={[styles.container, darkMode && styles.darkContainer]}>
            <Navigation onLogout={onLogout} darkMode={darkMode} toggleDarkMode={toggleDarkMode} navigation={navigation} />

            {/* Page Header */}
            <View style={styles.pageHeader}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <ArrowLeft size={20} color={darkMode ? '#D1D5DB' : '#374151'} />
                    <Text style={[styles.backText, darkMode && styles.textWhite]}>Back</Text>
                </TouchableOpacity>
                <Text style={[styles.headerTitle, darkMode && styles.textWhite]}>{title || 'Complaint List'}</Text>
                <Text style={[styles.headerSubtitle, darkMode && styles.textGray]}>{complaints.length} complaint{complaints.length !== 1 ? 's' : ''}</Text>
            </View>

            {/* Export Button */}
            <View style={styles.actionBar}>
                <TouchableOpacity style={styles.exportButton} onPress={() => setShowPDFModal(true)}>
                    <Download size={18} color="white" />
                    <Text style={styles.exportButtonText}>Export as PDF</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={filteredComplaints}
                keyExtractor={item => item.id.toString()}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <FileText size={64} color="#9CA3AF" />
                        <Text style={[styles.emptyTitle, darkMode && styles.textWhite]}>No complaints found</Text>
                        <Text style={[styles.emptyText, darkMode && styles.textGray]}>
                            {statusFilter
                                ? `No ${statusFilter.replace('_', ' ')} complaints found.`
                                : "No complaints available."}
                        </Text>
                    </View>
                }
                renderItem={({ item }) => (
                    <TouchableOpacity
                        style={[styles.card, darkMode && styles.cardDark]}
                        onPress={() => navigation.navigate('AuthorityComplaintDetail', { complaintId: item.id, initialData: item })}
                        activeOpacity={0.7}
                    >
                        <View style={styles.cardHeader}>
                            <View style={[styles.iconContainer, darkMode && styles.iconContainerDark]}>
                                <StatusIcon status={item.currentStatus} />
                            </View>
                            <View style={styles.cardContent}>
                                <Text style={[styles.cardTitle, darkMode && styles.textWhite]} numberOfLines={2}>
                                    {item.title}
                                </Text>
                                <Text style={[styles.cardDesc, darkMode && styles.textGray]} numberOfLines={2}>
                                    {item.description || 'No description provided'}
                                </Text>
                            </View>
                            <StatusBadge status={item.currentStatus} />
                        </View>

                        <View style={[styles.cardFooter, darkMode && styles.cardFooterDark]}>
                            <View style={styles.footerItem}>
                                <Calendar size={14} color="#9CA3AF" />
                                <Text style={styles.footerText}>
                                    {new Date(item.createdAt).toLocaleDateString()}
                                </Text>
                            </View>
                            <View style={styles.footerItem}>
                                <MapPin size={14} color="#9CA3AF" />
                                <Text style={styles.footerText}>{item.ward || 'Unknown Ward'}</Text>
                            </View>
                        </View>
                    </TouchableOpacity>
                )}
            />

            {renderPDFModal()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F9FAFB' },
    darkContainer: { backgroundColor: '#111827' },

    // Page Header
    pageHeader: {
        padding: 16,
        paddingTop: 12,
        paddingBottom: 16,
    },
    backBtn: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 6 },
    backText: { fontSize: 14, color: '#374151', fontWeight: '500' },
    headerTitle: { fontSize: 24, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    headerSubtitle: { fontSize: 14, color: '#6B7280' },
    textWhite: { color: 'white' },
    textGray: { color: '#9CA3AF' },

    // Action Bar (for Export button)
    actionBar: {
        paddingHorizontal: 16,
        paddingBottom: 16,
    },
    exportButton: {
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
        gap: 8,
        elevation: 2,
        shadowColor: '#1E88E5',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    exportButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },

    // List
    listContent: { paddingHorizontal: 16, paddingBottom: 100 },

    // Empty State
    emptyContainer: { alignItems: 'center', paddingVertical: 60, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#1F2937', marginTop: 16, marginBottom: 8 },
    emptyText: { fontSize: 14, color: '#6B7280', textAlign: 'center', lineHeight: 20 },

    // Card
    card: {
        backgroundColor: 'white',
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        elevation: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    cardDark: { backgroundColor: '#1F2937', borderColor: '#374151' },
    cardHeader: { flexDirection: 'row', padding: 16, alignItems: 'flex-start' },
    iconContainer: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12
    },
    iconContainerDark: { backgroundColor: '#374151' },
    cardContent: { flex: 1, marginRight: 12 },
    cardTitle: { fontSize: 16, fontWeight: 'bold', color: '#1F2937', marginBottom: 4 },
    cardDesc: { fontSize: 14, color: '#6B7280', lineHeight: 20 },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
    badgeText: { fontSize: 10, fontWeight: 'bold', letterSpacing: 0.5 },
    cardFooter: {
        flexDirection: 'row',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        gap: 16
    },
    cardFooterDark: { borderTopColor: '#374151' },
    footerItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    footerText: { fontSize: 12, color: '#9CA3AF' },

    // PDF Modal
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 24,
        width: '85%',
        maxWidth: 400,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1F2937',
    },
    modalDescription: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 20,
    },
    periodOption: {
        padding: 16,
        borderRadius: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        marginBottom: 12,
    },
    periodOptionSelected: {
        borderColor: '#1E88E5',
        backgroundColor: '#EFF6FF',
    },
    periodText: {
        fontSize: 16,
        color: '#374151',
        fontWeight: '500',
    },
    periodTextSelected: {
        color: '#1E88E5',
        fontWeight: 'bold',
    },
    generateButton: {
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        borderRadius: 8,
        marginTop: 8,
        gap: 8,
    },
    generateButtonText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    modalLabel: { fontSize: 13, fontWeight: 'bold', color: '#9CA3AF', marginBottom: 12, marginTop: 16, letterSpacing: 0.5 },
    selectionSection: { marginTop: 8 },
    filterGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white' },
    filterChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
    filterChipText: { fontSize: 13, color: '#6B7280' },
    filterChipTextActive: { color: 'white', fontWeight: 'bold' },
    monthGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    monthChip: { width: '23%', paddingVertical: 8, alignItems: 'center', borderRadius: 8, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: 'white' },
    monthChipActive: { backgroundColor: '#1E88E5', borderColor: '#1E88E5' },
    monthChipText: { fontSize: 12, color: '#6B7280' },
    monthChipTextActive: { color: 'white', fontWeight: 'bold' },
});
