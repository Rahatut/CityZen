import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { CheckCircle, XCircle, Clock, MapPin, ArrowLeft, ThumbsUp, Users } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function AuthorityComplaintsScreen({ darkMode }) {
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaints, setComplaints] = useState([
    { 
      id: '1', title: 'Leaking Pipe', location: 'Dhanmondi 27', ward: 'Ward 15', 
      status: 'Pending', time: '1h ago', upvotes: 142, 
      desc: 'Main water line burst near the main road. Significant flooding and low pressure in nearby buildings.',
      img: 'https://images.unsplash.com/photo-1542013936693-884638332954?auto=format&fit=crop&w=500' 
    },
    { 
      id: '2', title: 'Streetlight Out', location: 'Banani 11', ward: 'Ward 19', 
      status: 'Accepted', time: '5h ago', upvotes: 38, 
      desc: 'Three lamps in a row are non-functional. Area is pitch black at night, causing safety concerns.',
      img: 'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=500' 
    },
  ]);

  const getStatusColor = (status) => {
    if (status === 'Pending') return '#F59E0B';
    if (status === 'Accepted') return '#1E88E5';
    return '#10B981';
  };

  const ActionRow = ({ item }) => (
    <View style={styles.actionRow}>
      {item.status === 'Pending' ? (
        <>
          <TouchableOpacity style={[styles.btn, styles.btnAccept]}><CheckCircle size={16} color="white" /><Text style={styles.btnText}>Accept</Text></TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnReject]}><XCircle size={16} color="white" /><Text style={styles.btnText}>Reject</Text></TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={[styles.btn, styles.btnProgress]}><Clock size={16} color="white" /><Text style={styles.btnText}>Start Work</Text></TouchableOpacity>
      )}
    </View>
  );

  // --- DETAILS VIEW ---
  if (selectedComplaint) {
    return (
      <ScrollView style={[styles.container, darkMode && styles.darkContainer]} bounces={false}>
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={() => setSelectedComplaint(null)} style={styles.backBtn}><ArrowLeft size={24} color="white" /></TouchableOpacity>
          <Text style={styles.detailHeaderTitle}>Complaint Details</Text>
        </View>
        <Image source={{ uri: selectedComplaint.img }} style={styles.detailImage} />
        
        <View style={[styles.detailBody, darkMode && styles.cardDark]}>
          <View style={styles.detailTitleRow}>
            <Text style={[styles.detailTitle, darkMode && styles.textWhite]}>{selectedComplaint.title}</Text>
            {/* UPVOTES IN DETAILS */}
            <View style={styles.detailUpvoteBadge}>
              <ThumbsUp size={18} color="#1E88E5" />
              <Text style={styles.detailUpvoteText}>{selectedComplaint.upvotes}</Text>
            </View>
          </View>

          <View style={styles.locationContainer}>
            <MapPin size={20} color="#1E88E5" />
            <View style={{ marginLeft: 10 }}>
              <Text style={[styles.locMain, darkMode && styles.textWhite]}>{selectedComplaint.location}</Text>
              <Text style={styles.locSub}>{selectedComplaint.ward}</Text>
            </View>
          </View>

          <View style={styles.priorityBox}>
             <Users size={16} color="#1E88E5" />
             <Text style={styles.priorityText}>Community Priority: High ({selectedComplaint.upvotes} Citizens affected)</Text>
          </View>

          <Text style={styles.sectionLabel}>Citizen Report</Text>
          <Text style={[styles.descText, darkMode && styles.textGray]}>{selectedComplaint.desc}</Text>
          
          <View style={{ marginTop: 20 }}><ActionRow item={selectedComplaint} /></View>
        </View>
      </ScrollView>
    );
  }

  // --- LIST VIEW ---
  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <View style={styles.header}><Text style={[styles.title, darkMode && styles.textWhite]}>Work Queue</Text></View>
      <FlatList
        data={complaints}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={[styles.complaintCard, darkMode && styles.cardDark]} onPress={() => setSelectedComplaint(item)}>
            <View style={styles.cardHeader}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
              <Text style={styles.statusText}>{item.status}</Text>
              {/* UPVOTE BADGE ON CARD */}
              <View style={styles.cardUpvoteBadge}>
                <ThumbsUp size={12} color="#1E88E5" />
                <Text style={styles.cardUpvoteText}>{item.upvotes}</Text>
              </View>
            </View>
            
            <Text style={[styles.complaintTitle, darkMode && styles.textWhite]}>{item.title}</Text>
            <View style={styles.locRow}><MapPin size={14} color="#6B7280" /><Text style={styles.locText}>{item.location} • {item.ward}</Text></View>
            <ActionRow item={item} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F3F4F6' },
  darkContainer: { backgroundColor: '#111827' },
  header: { padding: 16, marginTop: 40 },
  title: { fontSize: 22, fontWeight: 'bold' },
  textWhite: { color: 'white' },
  textGray: { color: '#9CA3AF' },
  
  // List Card
  complaintCard: { backgroundColor: 'white', borderRadius: 15, padding: 16, marginBottom: 16, marginHorizontal: 16, elevation: 4 },
  cardDark: { backgroundColor: '#1F2937' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  statusText: { fontSize: 12, color: '#6B7280', flex: 1, fontWeight: 'bold' },
  cardUpvoteBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF5FF', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  cardUpvoteText: { fontSize: 12, color: '#1E88E5', fontWeight: 'bold', marginLeft: 4 },
  complaintTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 6 },
  locRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  locText: { fontSize: 13, color: '#6B7280', marginLeft: 4 },

  // Details View
  detailHeader: { position: 'absolute', top: 0, width: '100%', zIndex: 10, flexDirection: 'row', alignItems: 'center', padding: 20, paddingTop: 50, backgroundColor: 'rgba(0,0,0,0.2)' },
  detailHeaderTitle: { color: 'white', fontSize: 18, fontWeight: 'bold', marginLeft: 15 },
  detailImage: { width: width, height: 280 },
  detailBody: { marginTop: -30, borderTopLeftRadius: 30, borderTopRightRadius: 30, backgroundColor: 'white', padding: 25, flex: 1 },
  detailTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  detailTitle: { fontSize: 24, fontWeight: 'bold', flex: 1, marginRight: 10 },
  detailUpvoteBadge: { alignItems: 'center', backgroundColor: '#F0F7FF', padding: 10, borderRadius: 15, minWidth: 50 },
  detailUpvoteText: { color: '#1E88E5', fontWeight: 'bold', fontSize: 16, marginTop: 2 },
  locationContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  locMain: { fontSize: 18, fontWeight: 'bold' },
  locSub: { fontSize: 13, color: '#6B7280' },
  priorityBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0FDF4', padding: 12, borderRadius: 10, marginBottom: 20 },
  priorityText: { color: '#15803D', fontSize: 12, fontWeight: 'bold', marginLeft: 8 },
  sectionLabel: { fontSize: 12, fontWeight: 'bold', color: '#9CA3AF', textTransform: 'uppercase', marginBottom: 8 },
  descText: { fontSize: 15, lineHeight: 22, color: '#4B5563' },

  // Buttons
  actionRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 15 },
  btn: { flex: 1, flexDirection: 'row', height: 45, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginHorizontal: 5 },
  btnAccept: { backgroundColor: '#10B981' },
  btnReject: { backgroundColor: '#EF4444' },
  btnProgress: { backgroundColor: '#1E88E5' },
  btnText: { color: 'white', fontWeight: 'bold', fontSize: 14, marginLeft: 8 }
});