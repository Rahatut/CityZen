

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

export default function AuthorityAnalyticsScreen() {
	const [metrics, setMetrics] = useState({
		total: 0,
		resolved: 0,
		pending: 0,
		escalated: 0,
		avgResolution: 0,
	});
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

				// Filter complaints handled by this company
				const deptComplaints = complaints.filter(c => c.authorityCompanyId === Number(companyId) || c.authorityCompanyId === companyId);

				let total = deptComplaints.length;
				let resolved = 0;
				let pending = 0;
				let escalated = 0;
				let avgResolution = 0;
				let resolutionTimes = [];

				for (const c of deptComplaints) {
					if (c.currentStatus === 'resolved') {
						resolved++;
						if (c.createdAt && c.updatedAt) {
							const created = new Date(c.createdAt).getTime();
							const updated = new Date(c.updatedAt).getTime();
							if (updated > created) {
								resolutionTimes.push(updated - created);
							}
						}
					}
					if (c.currentStatus === 'pending') pending++;
					if (c.currentStatus === 'escalated') escalated++;
				}

				if (resolutionTimes.length > 0) {
					const totalMs = resolutionTimes.reduce((sum, ms) => sum + ms, 0);
					avgResolution = parseFloat((totalMs / resolutionTimes.length / 1000 / 60 / 60).toFixed(1));
				}

				setMetrics({ total, resolved, pending, escalated, avgResolution });
			} catch (e) {
				setMetrics({ total: 0, resolved: 0, pending: 0, escalated: 0, avgResolution: 0 });
			} finally {
				setLoading(false);
			}
		};
		fetchProfileAndAnalytics();
	}, []);

	return (
		<ScrollView contentContainerStyle={styles.container}>
			<Text style={styles.title}>Complaint Statistics & Analytics</Text>
			<View style={styles.metricsRow}>
				<View style={styles.metricBox}>
					<Text style={styles.metricLabel}>Total Complaints</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.total}</Text>
				</View>
				<View style={styles.metricBox}>
					<Text style={styles.metricLabel}>Resolved</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.resolved}</Text>
				</View>
				<View style={styles.metricBox}>
					<Text style={styles.metricLabel}>Pending</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.pending}</Text>
				</View>
				<View style={styles.metricBox}>
					<Text style={styles.metricLabel}>Escalated</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.escalated}</Text>
				</View>
				<View style={styles.metricBox}>
					<Text style={styles.metricLabel}>Avg. Resolution Time (hrs)</Text>
					<Text style={styles.metricValue}>{loading ? <ActivityIndicator size="small" /> : metrics.avgResolution}</Text>
				</View>
			</View>
			<View style={styles.section}><Text style={styles.sectionTitle}>[Charts Coming Soon]</Text></View>
			<View style={styles.section}><Text style={styles.sectionTitle}>[Recent Complaints Table Placeholder]</Text></View>
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
});


