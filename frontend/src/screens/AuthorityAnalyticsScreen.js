

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Modal, FlatList, Image } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation } from '@react-navigation/native';
import { X, Calendar, MapPin, CheckCircle, Clock, AlertCircle, TrendingUp } from 'lucide-react-native';
import api from '../services/api';

export default function AuthorityAnalyticsScreen() {
	const navigation = useNavigation();
	const [metrics, setMetrics] = useState({
		total: 0,
		resolved: 0,
		pending: 0,
		appealed: 0,
		accepted: 0,
		inProgress: 0,
		avgResolution: 0,
	});
	const [deptComplaints, setDeptComplaints] = useState([]);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		const fetchProfileAndAnalytics = async () => {
			setLoading(true);
			try {
				// Get companyId from profile
				let companyId = await AsyncStorage.getItem('authorityCompanyId');
				if (!companyId) {
					const userDataStr = await AsyncStorage.getItem('userData');
					if (userDataStr) {
						const userData = JSON.parse(userDataStr);
						companyId = userData.companyId || userData.authorityCompanyId;
					}
				}
				let response;
				if (companyId) {
					response = await api.get(`/complaints/authority/${companyId}?limit=100`);
				} else {
					response = await api.get('/complaints?limit=100');
				}
				const complaints = response.data.complaints || response.data;

				// Debug: Log first complaint to see structure
				if (complaints.length > 0) {
					console.log("AuthorityAnalytics Sample Complaint:", JSON.stringify(complaints[0], null, 2));
				}

				// Since we're using /complaints/authority/${companyId}, the backend already filters by authority
				// We should trust that data rather than re-filtering
				const deptComplaints = complaints;

				console.log("AuthorityAnalytics Debug:", {
					companyId,
					allComplaintsCount: complaints.length,
					deptComplaintsCount: deptComplaints.length
				});

				let total = deptComplaints.length;
				let resolved = 0;
				let pending = 0;
				let appealed = 0;
				let accepted = 0;
				let inProgress = 0;
				let avgResolution = 0;
				let resolutionTimes = [];

				for (const c of deptComplaints) {
					const status = c.currentStatus ? c.currentStatus.toLowerCase() : '';

					if (status === 'resolved' || status === 'closed' || status === 'completed') {
						resolved++;
						if (c.createdAt && c.updatedAt) {
							const created = new Date(c.createdAt).getTime();
							const updated = new Date(c.updatedAt).getTime();
							if (updated > created) {
								resolutionTimes.push(updated - created);
							}
						}
					}
					else if (status === 'pending') pending++;
					else if (status === 'appealed') appealed++;
					else if (status === 'accepted') accepted++;
					else if (status === 'in_progress' || status === 'assigned') inProgress++;
				}

				if (resolutionTimes.length > 0) {
					const totalMs = resolutionTimes.reduce((sum, ms) => sum + ms, 0);
					avgResolution = parseFloat((totalMs / resolutionTimes.length / 1000 / 60 / 60).toFixed(1));
				}

				setDeptComplaints(deptComplaints);
				setMetrics({ total, resolved, pending, appealed, accepted, inProgress, avgResolution });
			} catch (e) {
				console.error("Analytics Error:", e);
				setMetrics({ total: 0, resolved: 0, pending: 0, appealed: 0, accepted: 0, inProgress: 0, avgResolution: 0 });
			} finally {
				setLoading(false);
			}
		};
		fetchProfileAndAnalytics();
	}, []);

	const StatusIcon = ({ status }) => {
		const s = status ? status.toLowerCase() : '';
		if (['resolved', 'closed', 'completed'].includes(s)) return <CheckCircle size={20} color="#16A34A" />;
		if (s === 'pending') return <Clock size={20} color="#EA580C" />;
		if (['in_progress', 'accepted'].includes(s)) return <TrendingUp size={20} color="#1E88E5" />;
		return <AlertCircle size={20} color="#6B7280" />;
	};

	const openMetricsModal = (type) => {
		const titleMap = {
			'total': 'Total Complaints',
			'resolved': 'Resolved Complaints',
			'pending': 'Pending Complaints',
			'appealed': 'Appealed Complaints',
			'accepted': 'Accepted Complaints',
			'inProgress': 'In Progress Complaints'
		};

		navigation.navigate('AuthorityComplaintList', {
			statusFilter: type,
			title: titleMap[type] || 'Complaints',
			complaints: getFilteredComplaints(type)
		});
	};

	const getFilteredComplaints = (metricType) => {
		if (!metricType) return [];
		if (metricType === 'total') return deptComplaints;

		return deptComplaints.filter(c => {
			const status = c.currentStatus ? c.currentStatus.toLowerCase() : '';
			if (metricType === 'resolved') return ['resolved', 'closed', 'completed'].includes(status);
			if (metricType === 'pending') return status === 'pending';
			if (metricType === 'appealed') return status === 'appealed';
			if (metricType === 'accepted') return status === 'accepted';
			if (metricType === 'inProgress') return ['in_progress', 'assigned'].includes(status);
			return false;
		});
	};



	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Complaint Statistics & Analytics</Text>
			<View style={styles.metricsRow}>
				<TouchableOpacity style={styles.metricBox} onPress={() => openMetricsModal('total')}>
					<Text style={styles.metricLabel}>Total</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.total}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.metricBox} onPress={() => openMetricsModal('pending')}>
					<Text style={styles.metricLabel}>Pending</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.pending}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.metricBox} onPress={() => openMetricsModal('appealed')}>
					<Text style={styles.metricLabel}>Appealed</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.appealed}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.metricBox} onPress={() => openMetricsModal('accepted')}>
					<Text style={styles.metricLabel}>Accepted</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.accepted}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.metricBox} onPress={() => openMetricsModal('inProgress')}>
					<Text style={styles.metricLabel}>In Progress</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.inProgress}</Text>
				</TouchableOpacity>
				<TouchableOpacity style={styles.metricBox} onPress={() => openMetricsModal('resolved')}>
					<Text style={styles.metricLabel}>Resolved</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.resolved}</Text>
				</TouchableOpacity>
				<View style={[styles.metricBox, { flexBasis: '100%' }]}>
					<Text style={styles.metricLabel}>Avg. Resolution Time (hrs)</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.avgResolution}</Text>
				</View>
			</View>

			<View style={styles.section}><Text style={styles.sectionTitle}>[Charts Coming Soon]</Text></View>
			<View style={styles.metricsRow}><Text style={styles.sectionTitle}>[Recent Complaints Table Placeholder]</Text></View>
			<View style={styles.section}><Text style={styles.sectionTitle}>[Top Recurring Issues Table Placeholder]</Text></View>
			<View style={styles.section}><Text style={styles.sectionTitle}>[Overdue Complaints Table Placeholder]</Text></View>
			<View style={styles.section}><Text style={styles.sectionTitle}>[Trends & KPIs Placeholder]</Text></View>
			<TouchableOpacity style={styles.exportBtn}>
				<Text style={styles.exportBtnText}>Export as PDF/CSV</Text>
			</TouchableOpacity>
		</ScrollView>
	);
}

const styles = StyleSheet.create({
	container: {
		padding: 24,
		alignItems: 'center',
		backgroundColor: '#F9FAFB',
	},
	title: {
		fontSize: 22,
		fontWeight: 'bold',
		marginBottom: 24,
		color: '#1E293B',
		textAlign: 'center',
	},
	metricsRow: {
		flexDirection: 'row',
		flexWrap: 'wrap',
		justifyContent: 'space-between',
		marginBottom: 32,
		width: '100%',
	},
	metricBox: {
		backgroundColor: '#f3f4f6',
		borderRadius: 12,
		padding: 20,
		alignItems: 'center',
		flexBasis: '48%',
		marginBottom: 16,
	},
	metricLabel: {
		fontSize: 14,
		color: '#64748B',
		marginBottom: 8,
		textAlign: 'center',
	},
	metricValue: {
		fontSize: 28,
		fontWeight: '700',
		color: '#1E293B',
		textAlign: 'center',
	},
	section: {
		backgroundColor: '#fff',
		borderRadius: 12,
		minHeight: 80,
		padding: 16,
		marginBottom: 20,
		width: '100%',
		alignItems: 'center',
		justifyContent: 'center',
		shadowColor: '#e5e7eb',
		shadowOffset: { width: 0, height: 1 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 2,
	},
	sectionTitle: {
		color: '#9ca3af',
		fontSize: 16,
		textAlign: 'center',
	},
	exportBtn: {
		paddingVertical: 12,
		paddingHorizontal: 32,
		borderRadius: 8,
		backgroundColor: '#1E88E5',
		marginTop: 16,
	},
	exportBtnText: {
		color: '#fff',
		fontWeight: '600',
		fontSize: 16,
	},
	modalOverlay: {
		flex: 1,
		backgroundColor: 'rgba(0,0,0,0.5)',
		justifyContent: 'flex-end',
	},
	modalContent: {
		backgroundColor: 'white',
		borderTopLeftRadius: 20,
		borderTopRightRadius: 20,
		padding: 20,
		height: '80%',
	},
	modalHeader: {
		flexDirection: 'row',
		justifyContent: 'space-between',
		alignItems: 'center',
		marginBottom: 20,
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		color: '#1F2937',
		flex: 1,
	},
	modalSubtitle: {
		fontSize: 14,
		color: '#6B7280',
		marginBottom: 16,
	},
	complaintCard: {
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
	cardHeader: {
		flexDirection: 'row',
		padding: 16,
		alignItems: 'flex-start'
	},
	iconContainer: {
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: '#F3F4F6',
		alignItems: 'center',
		justifyContent: 'center',
		marginRight: 12
	},
	cardContent: {
		flex: 1,
		marginRight: 12
	},
	cardTitle: {
		fontSize: 16,
		fontWeight: 'bold',
		color: '#1F2937',
		marginBottom: 4
	},
	cardDesc: {
		fontSize: 14,
		color: '#6B7280',
		lineHeight: 20
	},
	badge: {
		paddingHorizontal: 8,
		paddingVertical: 4,
		borderRadius: 6,
		alignSelf: 'flex-start'
	},
	badgeText: {
		fontSize: 10,
		fontWeight: 'bold',
		letterSpacing: 0.5
	},
	cardFooter: {
		flexDirection: 'row',
		paddingHorizontal: 16,
		paddingVertical: 12,
		borderTopWidth: 1,
		borderTopColor: '#F3F4F6',
		gap: 16
	},
	footerItem: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 6
	},
	footerText: {
		fontSize: 12,
		color: '#9CA3AF'
	},
	complaintLoc: {
		fontSize: 12,
		color: '#6B7280',
		marginBottom: 4,
	},
	complaintDate: {
		fontSize: 10,
		color: '#9CA3AF',
	},
	emptyText: {
		textAlign: 'center',
		color: '#6B7280',
		marginTop: 20,
	},
	detailImage: {
		width: '100%',
		height: 200,
		borderRadius: 12,
		marginBottom: 16,
	},
	detailTitle: {
		fontSize: 20,
		fontWeight: 'bold',
		color: '#111827',
		marginBottom: 12,
	},
	detailRow: {
		flexDirection: 'row',
		alignItems: 'center',
		marginBottom: 8,
		gap: 8,
	},
	detailText: {
		fontSize: 14,
		color: '#4B5563',
	},
	sectionHeader: {
		fontSize: 16,
		fontWeight: '600',
		color: '#374151',
		marginTop: 20,
		marginBottom: 8,
	},
	descriptionText: {
		fontSize: 14,
		color: '#4B5563',
		lineHeight: 22,
	},
	notesText: {
		fontSize: 14,
		color: '#6B7280',
		fontStyle: 'italic',
		lineHeight: 22,
	},
});
