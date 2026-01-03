import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useComplaint } from '../context/ComplaintContext';
import { Home, List } from 'lucide-react-native';

export default function SubmittedComplaintScreen({ navigation }) {
    const {
        images,
        location,
        locationTime,
        title,
        description,
        selectedCategory,
        assignedAuthorities, // Destructure assignedAuthorities
        resetState,
    } = useComplaint();

    const handleGoHome = () => {
        navigation.navigate('HomeScreen');
        resetState();
    };

    const handleGoToFeed = () => {
        navigation.navigate('Feed');
        resetState();
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerText}>Your complaint has been submitted!</Text>
            </View>

            <ScrollView contentContainerStyle={styles.detailsContainer}>
                <View style={styles.card}>
                    <Text style={styles.sectionTitle}>Complaint Details</Text>

                    <View style={styles.detailItem}>
                        <Text style={styles.label}>Title</Text>
                        <Text style={styles.value}>{title || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.label}>Description</Text>
                        <Text style={styles.value}>{description || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.label}>Category</Text>
                        <Text style={styles.value}>{selectedCategory?.name || 'N/A'}</Text>
                    </View>

                    {assignedAuthorities.length > 0 && (
                        <View style={styles.detailItem}>
                            <Text style={styles.label}>Routed To Authorities</Text>
                            {assignedAuthorities.map((authorityName, index) => (
                                <Text key={index} style={styles.value}>{authorityName}</Text>
                            ))}
                        </View>
                    )}

                    <View style={styles.detailItem}>
                        <Text style={styles.label}>Location</Text>
                        <Text style={styles.value}>
                            {location?.fullAddress || `${location?.latitude}, ${location?.longitude}` || 'N/A'}
                        </Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.label}>Time</Text>
                        <Text style={styles.value}>{locationTime || 'N/A'}</Text>
                    </View>

                    <View style={styles.detailItem}>
                        <Text style={styles.label}>Images</Text>
                        {images.length > 0 ? (
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScrollView}>
                                {images.map((uri, index) => (
                                    <Image key={index} source={{ uri }} style={styles.previewImage} />
                                ))}
                            </ScrollView>
                        ) : (
                            <Text style={styles.value}>No images attached.</Text>
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity onPress={handleGoHome} style={styles.footerButton}>
                    <Home size={28} color="white" />
                    <Text style={styles.footerButtonText}>Home</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleGoToFeed} style={styles.footerButton}>
                    <List size={28} color="white" />
                    <Text style={styles.footerButtonText}>Feed</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F9FAFB',
    },
    header: {
        height: 200,
        backgroundColor: '#1E88E5',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20,
    },
    headerText: {
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        color: 'white',
        marginTop: 10,
    },
    detailsContainer: {
        padding: 20,
    },
    card: {
        backgroundColor: 'white',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    sectionTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#1F2937',
        marginBottom: 20,
        borderBottomWidth: 1,
        borderBottomColor: '#E5E7EB',
        paddingBottom: 10,
    },
    detailItem: {
        marginBottom: 15,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#6B7280',
        marginBottom: 4,
    },
    value: {
        fontSize: 16,
        color: '#111827',
    },
    imageScrollView: {
        marginTop: 8,
    },
    previewImage: {
        width: 100,
        height: 100,
        borderRadius: 8,
        marginRight: 10,
    },
    footer: {
        height: 90,
        backgroundColor: '#1E88E5',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        paddingHorizontal: 20,
        borderTopWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    footerButton: {
        alignItems: 'center',
        gap: 4,
    },
    footerButtonText: {
        color: 'white',
        fontSize: 12,
        fontWeight: '600',
    },
});
