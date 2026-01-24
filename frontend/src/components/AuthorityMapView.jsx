import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Modal, ScrollView, Image } from 'react-native';
import { MapPin, X, CheckCircle, Clock, AlertCircle } from 'lucide-react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';

export default function AuthorityMapView({ complaints, darkMode, onComplaintSelect }) {
  const mapRef = useRef(null);
  const [selectedMarker, setSelectedMarker] = useState(null);
  const [region, setRegion] = useState({
    latitude: 23.8103,
    longitude: 90.4125,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });

  // Color based on status
  const getStatusColor = (status) => {
    if (status === 'Pending') return '#F59E0B';
    if (status === 'Accepted' || status === 'In Progress') return '#1E88E5';
    if (status === 'Resolved' || status === 'Completed') return '#10B981';
    return '#6B7280';
  };

  // Fit map to show all markers
  useEffect(() => {
    if (mapRef.current && complaints.length > 0) {
      const validComplaints = complaints.filter(c => c.latitude && c.longitude);
      if (validComplaints.length > 0) {
        const latitudes = validComplaints.map(c => parseFloat(c.latitude));
        const longitudes = validComplaints.map(c => parseFloat(c.longitude));
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);

        const midLat = (minLat + maxLat) / 2;
        const midLng = (minLng + maxLng) / 2;
        const deltaLat = maxLat - minLat;
        const deltaLng = maxLng - minLng;

        setRegion({
          latitude: midLat,
          longitude: midLng,
          latitudeDelta: Math.max(deltaLat * 1.5, 0.1),
          longitudeDelta: Math.max(deltaLng * 1.5, 0.1),
        });
      }
    }
  }, [complaints]);

  // Status badge icon
  const getStatusIcon = (status) => {
    if (status === 'Pending') return <AlertCircle size={16} color="#F59E0B" />;
    if (status === 'Accepted' || status === 'In Progress') return <Clock size={16} color="#1E88E5" />;
    if (status === 'Resolved' || status === 'Completed') return <CheckCircle size={16} color="#10B981" />;
    return null;
  };

  return (
    <View style={[styles.container, darkMode && styles.darkContainer]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={region}
        onRegionChange={setRegion}
        onRegionChangeComplete={setRegion}
        showsUserLocation={true}
        showsMyLocationButton={true}
        scrollEnabled={true}
        zoomEnabled={true}
        pitchEnabled={false}
        rotateEnabled={false}
        loadingEnabled={true}
        loadingIndicatorColor="#1E88E5"
        moveOnMarkerPress={false}
        minZoomLevel={10}
        maxZoomLevel={20}
      >
        {complaints.map((complaint) => {
          if (!complaint.latitude || !complaint.longitude) {
            console.log('Missing coordinates for complaint:', complaint.id, complaint.title);
            return null;
          }
          
          const latitude = parseFloat(complaint.latitude);
          const longitude = parseFloat(complaint.longitude);
          
          if (isNaN(latitude) || isNaN(longitude)) {
            console.log('Invalid coordinates for complaint:', complaint.id, 'lat:', complaint.latitude, 'lng:', complaint.longitude);
            return null;
          }

          console.log('Adding marker for complaint:', complaint.id, 'at', latitude, longitude);
          
          return (
            <Marker
              key={complaint.id}
              coordinate={{ latitude, longitude }}
              title={complaint.title}
              description={complaint.location}
              onPress={() => {
                setSelectedMarker(complaint);
              }}
              pinColor={getStatusColor(complaint.status)}
            />
          );
        })}
      </MapView>

      {/* Details Modal */}
      <Modal
        visible={selectedMarker !== null}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setSelectedMarker(null)}
      >
        <View style={styles.modalOverlay}>
          <ScrollView
            style={[styles.detailsPanel, darkMode && styles.detailsPanelDark]}
            contentContainerStyle={{ flexGrow: 1 }}
          >
            {selectedMarker && (
              <>
                <TouchableOpacity
                  style={styles.modalCloseButton}
                  onPress={() => setSelectedMarker(null)}
                >
                  <X size={24} color={darkMode ? 'white' : 'black'} />
                </TouchableOpacity>

                <Image
                  source={{ uri: selectedMarker.citizenProof }}
                  style={styles.complaintImage}
                />

                <View style={[styles.detailContent, darkMode && styles.detailContentDark]}>
                  <View style={styles.titleRow}>
                    <Text style={[styles.complaintTitle, darkMode && styles.textWhite]}>
                      {selectedMarker.title}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(selectedMarker.status) }]}>
                      {getStatusIcon(selectedMarker.status)}
                      <Text style={styles.statusBadgeText}>{selectedMarker.status}</Text>
                    </View>
                  </View>

                  <View style={styles.locationRow}>
                    <MapPin size={18} color="#1E88E5" />
                    <View style={{ marginLeft: 10, flex: 1 }}>
                      <Text style={[styles.locationMain, darkMode && styles.textWhite]}>
                        {selectedMarker.location}
                      </Text>
                      <Text style={styles.ward}>{selectedMarker.ward}</Text>
                    </View>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, darkMode && styles.textGray]}>Category:</Text>
                    <Text style={[styles.infoValue, darkMode && styles.textWhite]}>
                      {selectedMarker.category}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, darkMode && styles.textGray]}>Community Support:</Text>
                    <Text style={[styles.infoValue, darkMode && styles.textWhite]}>
                      {selectedMarker.upvotes} citizens
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.infoLabel, darkMode && styles.textGray]}>Reported:</Text>
                    <Text style={[styles.infoValue, darkMode && styles.textWhite]}>
                      {selectedMarker.time}
                    </Text>
                  </View>

                  <Text style={styles.descriptionLabel}>Description</Text>
                  <Text style={[styles.description, darkMode && styles.textGray]}>
                    {selectedMarker.description}
                  </Text>

                  <TouchableOpacity
                    style={styles.viewDetailsButton}
                    onPress={() => {
                      setSelectedMarker(null);
                      onComplaintSelect(selectedMarker);
                    }}
                  >
                    <Text style={styles.viewDetailsButtonText}>View Full Details</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  darkContainer: {
    backgroundColor: '#1F2937',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  textWhite: {
    color: 'white',
  },
  textGray: {
    color: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  detailsPanel: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  detailsPanelDark: {
    backgroundColor: '#1F2937',
  },
  modalCloseButton: {
    alignSelf: 'flex-end',
    padding: 16,
    paddingTop: 12,
  },
  complaintImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  detailContent: {
    padding: 16,
    paddingBottom: 32,
  },
  detailContentDark: {
    backgroundColor: '#1F2937',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  complaintTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginLeft: 8,
  },
  statusBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  locationRow: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  locationMain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  ward: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  descriptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 20,
  },
  viewDetailsButton: {
    backgroundColor: '#1E88E5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  viewDetailsButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
