import React, { useCallback, useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AlertTriangle,
  Bus,
  Calendar,
  Car,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  ExternalLink,
  Eye,
  Filter,
  Flame,
  Globe,
  Headphones,
  History,
  Layers,
  Lock,
  LogOut,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Tag,
  Trash2,
  TrendingUp,
  Truck,
  User,
  UserCheck,
  Users,
  Wrench,
  X,
  XCircle,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  approveAdminTrip,
  completeAdminTrip,
  createAdminRoadAdvisory,
  createAdminVehicle,
  deleteAdminRoadAdvisory,
  getAdminRoadAdvisories,
  getAdminStats,
  getAdminTrips,
  getAdminUsers,
  getAdminVehicles,
  getCustomerTrips,
  rejectAdminTrip,
  updateAdminVehicle,
} from '../../api/admin';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AuthContext } from '../../context/AuthContext';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import type { ThemeColors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type {
  AdminCustomer,
  AdminStats,
  AdminTrip,
  AdminVehicle,
  CreateRoadAdvisoryDto,
  CreateVehicleDto,
  CustomerTripHistory,
  RoadAdvisory,
} from '../../types/admin';
import { hapticFeedback } from '../../utils/haptics';

type TabType = 'trips' | 'fleet' | 'users';

export function AdminDashboardScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useThemedStyles(createStyles);
  const { logout, adminUser } = useAdminAuth();
  const authCtx = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState<TabType>('trips');
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [stats, setStats] = useState<AdminStats>({
    pendingRequests: 0,
    activeFleet: 0,
    totalUsers: 0,
    totalTrips: 0,
    totalRevenue: 'NPR 0',
  });

  // Data states
  const [trips, setTrips] = useState<AdminTrip[]>([]);
  const [vehicles, setVehicles] = useState<AdminVehicle[]>([]);
  const [users, setUsers] = useState<AdminCustomer[]>([]);

  // Filtering states
  const [tripFilter, setTripFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'>('Pending');
  const [fleetFilter, setFleetFilter] = useState<'all' | 'available' | 'maintenance'>('all');
  const [fleetCategoryFilter, setFleetCategoryFilter] = useState<'ALL' | 'SUV' | 'HiAce' | 'Sedan' | 'Bus'>('ALL');
  const [fleetSearch, setFleetSearch] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');

  // Himalayan Road Condition Advisories
  const [advisories, setAdvisories] = useState<RoadAdvisory[]>([]);
  const [isRoadAdvisoriesExpanded, setIsRoadAdvisoriesExpanded] = useState<boolean>(true);
  const [isAddAdvisoryOpen, setIsAddAdvisoryOpen] = useState<boolean>(false);
  const [newAdvisory, setNewAdvisory] = useState<CreateRoadAdvisoryDto>({
    routeName: '',
    status: 'caution',
    conditionSummary: '',
    severity: 'moderate',
  });
  const [isSubmittingAdvisory, setIsSubmittingAdvisory] = useState<boolean>(false);

  // Modals
  const [selectedTripToApprove, setSelectedTripToApprove] = useState<AdminTrip | null>(null);
  const [selectedTripToReject, setSelectedTripToReject] = useState<AdminTrip | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState<boolean>(false);

  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState<boolean>(false);
  const [newVehicle, setNewVehicle] = useState<CreateVehicleDto>({
    model: '',
    registrationPlate: '',
    category: 'SUV',
    seats: 5,
    fuelType: 'Diesel',
    status: 'available',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [customerTrips, setCustomerTrips] = useState<CustomerTripHistory[]>([]);
  const [loadingCustomerTrips, setLoadingCustomerTrips] = useState<boolean>(false);

  const loadAllData = useCallback(async () => {
    try {
      const [statsRes, tripsRes, fleetRes, usersRes, advisoriesRes] = await Promise.all([
        getAdminStats(),
        getAdminTrips(),
        getAdminVehicles(),
        getAdminUsers(),
        getAdminRoadAdvisories(),
      ]);

      if (statsRes) setStats(statsRes);
      if (Array.isArray(tripsRes)) setTrips(tripsRes);
      if (Array.isArray(fleetRes)) setVehicles(fleetRes);
      if (Array.isArray(usersRes)) setUsers(usersRes);
      if (Array.isArray(advisoriesRes)) setAdvisories(advisoriesRes);
    } catch (err) {
      console.warn('[AdminDashboard] Error refreshing dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleRefresh = async () => {
    hapticFeedback.light();
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  };

  const handleSignOut = () => {
    hapticFeedback.error();
    const executeSignOut = async () => {
      await logout();
      if (authCtx?.signOut) {
        try {
          await authCtx.signOut();
        } catch {
          // safely continue
        }
      }
    };

    if (Platform.OS === 'web') {
      void executeSignOut();
      return;
    }

    Alert.alert('Lock Admin Session', 'Are you sure you want to sign out of the Admin Portal?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Lock & Exit',
        style: 'destructive',
        onPress: executeSignOut,
      },
    ]);
  };

  // ----------------------------------------------------
  // DISPATCH DESK ACTIONS
  // ----------------------------------------------------
  const handleApproveWithVehicle = async (vehicleId: number) => {
    if (!selectedTripToApprove) return;
    setIsSubmittingDispatch(true);
    try {
      await approveAdminTrip(selectedTripToApprove.id, vehicleId);
      hapticFeedback.success();
      setSelectedTripToApprove(null);
      await loadAllData();
      Alert.alert('Trip Approved', 'Vehicle dispatched and customer notified via RLS notification.');
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Could not approve trip.';
      Alert.alert('Dispatch Error', msg);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedTripToReject) return;
    if (!rejectionReason.trim()) {
      hapticFeedback.error();
      Alert.alert('Required', 'Please provide a brief reason for rejecting the booking.');
      return;
    }
    setIsSubmittingDispatch(true);
    try {
      await rejectAdminTrip(selectedTripToReject.id, rejectionReason.trim());
      hapticFeedback.success();
      setSelectedTripToReject(null);
      setRejectionReason('');
      await loadAllData();
      Alert.alert('Trip Rejected', 'Reservation has been cancelled and traveler notified.');
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Could not reject booking.';
      Alert.alert('Error', msg);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

  const handleCompleteTrip = (trip: AdminTrip) => {
    hapticFeedback.selection();
    Alert.alert(
      'Complete Trip',
      `Mark reservation ${trip.bookingRef} as Completed?\n\nThis will release ${trip.assignedVehicleModel ? trip.assignedVehicleModel : 'the assigned vehicle'} back into the active fleet.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Complete & Release',
          style: 'default',
          onPress: async () => {
            setIsSubmittingDispatch(true);
            try {
              await completeAdminTrip(trip.id);
              hapticFeedback.success();
              await loadAllData();
              Alert.alert('Trip Completed', 'Reservation marked as Completed and vehicle returned to available fleet.');
            } catch (err: unknown) {
              hapticFeedback.error();
              const msg = err instanceof Error ? err.message : 'Could not complete trip.';
              Alert.alert('Error', msg);
            } finally {
              setIsSubmittingDispatch(false);
            }
          },
        },
      ],
    );
  };

  const handleDeleteAdvisory = (advisory: RoadAdvisory) => {
    hapticFeedback.selection();
    Alert.alert(
      'Dismiss Advisory',
      `Remove road condition bulletin for "${advisory.routeName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Dismiss Bulletin',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminRoadAdvisory(advisory.id);
              hapticFeedback.success();
              setAdvisories((prev) => prev.filter((a) => a.id !== advisory.id));
            } catch (err: unknown) {
              hapticFeedback.error();
              const msg = err instanceof Error ? err.message : 'Could not dismiss advisory.';
              Alert.alert('Error', msg);
            }
          },
        },
      ],
    );
  };

  const handleCreateAdvisory = async () => {
    if (!newAdvisory.routeName.trim() || !newAdvisory.conditionSummary.trim()) {
      hapticFeedback.error();
      Alert.alert('Missing Details', 'Please provide both the corridor name and condition details.');
      return;
    }
    setIsSubmittingAdvisory(true);
    try {
      const created = await createAdminRoadAdvisory(newAdvisory);
      hapticFeedback.success();
      setAdvisories((prev) => [created, ...prev]);
      setIsAddAdvisoryOpen(false);
      setNewAdvisory({
        routeName: '',
        status: 'caution',
        conditionSummary: '',
        severity: 'moderate',
      });
      Alert.alert('Advisory Published', 'Himalayan road bulletin posted to operations desk.');
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Could not publish advisory.';
      Alert.alert('Failed to Publish', msg);
    } finally {
      setIsSubmittingAdvisory(false);
    }
  };

  // ----------------------------------------------------
  // FLEET MANAGER ACTIONS
  // ----------------------------------------------------
  const handleToggleMaintenance = async (vehicle: AdminVehicle) => {
    hapticFeedback.selection();
    const newStatus = vehicle.status === 'maintenance' ? 'available' : 'maintenance';
    try {
      await updateAdminVehicle(vehicle.id, { status: newStatus });
      hapticFeedback.success();
      await loadAllData();
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Could not toggle vehicle maintenance status.';
      Alert.alert('Update Failed', msg);
    }
  };

  const handleCreateVehicle = async () => {
    if (!newVehicle.model.trim() || !newVehicle.registrationPlate.trim()) {
      hapticFeedback.error();
      Alert.alert('Missing Info', 'Model name and registration plate are required.');
      return;
    }

    try {
      await createAdminVehicle(newVehicle);
      hapticFeedback.success();
      setIsAddVehicleOpen(false);
      setNewVehicle({
        model: '',
        registrationPlate: '',
        category: 'SUV',
        seats: 5,
        fuelType: 'Diesel',
        status: 'available',
      });
      await loadAllData();
      Alert.alert('Success', 'New vehicle registered into active fleet.');
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Could not add vehicle.';
      Alert.alert('Failed to Add', msg);
    }
  };

  // ----------------------------------------------------
  // USERS DIRECTORY ACTIONS
  // ----------------------------------------------------
  const handleSelectCustomer = async (cust: AdminCustomer) => {
    hapticFeedback.selection();
    setSelectedCustomer(cust);
    setLoadingCustomerTrips(true);
    try {
      const history = await getCustomerTrips(cust.id);
      setCustomerTrips(history);
    } catch {
      setCustomerTrips([]);
    } finally {
      setLoadingCustomerTrips(false);
    }
  };

  // Filtered lists
  const filteredTrips = trips.filter((t) => {
    if (tripFilter === 'All') return true;
    return t.status.toLowerCase() === tripFilter.toLowerCase();
  });

  const filteredFleet = vehicles.filter((v) => {
    if (fleetFilter === 'available' && v.status !== 'available') return false;
    if (fleetFilter === 'maintenance' && v.status !== 'maintenance') return false;
    if (fleetCategoryFilter !== 'ALL' && v.category.toLowerCase() !== fleetCategoryFilter.toLowerCase()) return false;
    if (fleetSearch.trim()) {
      const q = fleetSearch.toLowerCase();
      return (
        v.model.toLowerCase().includes(q) ||
        v.registrationPlate.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const filteredUsers = users.filter((u) => {
    if (!userSearch.trim()) return true;
    const q = userSearch.toLowerCase();
    return (
      u.fullName.toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u.email.toLowerCase().includes(q)
    );
  });

  const effectiveStats = stats || {
    pendingRequests: 0,
    activeFleet: 0,
    totalUsers: 0,
    totalTrips: 0,
    totalRevenue: 'NPR 0',
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Operations Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.badgeShield}>
            <ShieldCheck size={20} color={colors.accent} strokeWidth={2.2} />
          </View>
          <View>
            <Text style={styles.headerBrand}>Control Desk</Text>
            <Text style={styles.headerAdminName}>Operator: {adminUser?.name || 'Admin'}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <View style={styles.rlsPill}>
            <View style={styles.rlsDot} />
            <Text style={styles.rlsText}>RLS ACTIVE</Text>
          </View>
          <Pressable
            onPress={handleSignOut}
            style={({ pressed }) => [styles.logoutBtn, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Sign out of Admin Portal"
          >
            <LogOut size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>

      {/* Main Scroll Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* Metric Cards Banner */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, styles.metricCardAlert]}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconWrap, { backgroundColor: colors.accentSoft }]}>
                <Clock size={16} color={colors.accent} />
              </View>
              <Text style={styles.metricLabel}>Pending</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.accent }]}>
              {effectiveStats.pendingRequests ?? 0}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconWrap, { backgroundColor: colors.successSoft }]}>
                <Car size={16} color={colors.success} />
              </View>
              <Text style={styles.metricLabel}>Available Fleet</Text>
            </View>
            <Text style={[styles.metricValue, { color: colors.success }]}>
              {effectiveStats.activeFleet ?? 0}
            </Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconWrap, { backgroundColor: colors.navySoft }]}>
                <Users size={16} color={colors.onNavy} />
              </View>
              <Text style={styles.metricLabel}>Customers</Text>
            </View>
            <Text style={styles.metricValue}>{effectiveStats.totalUsers ?? 0}</Text>
          </View>

          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconWrap, { backgroundColor: colors.accentSoft }]}>
                <TrendingUp size={16} color={colors.highlight} />
              </View>
              <Text style={styles.metricLabel}>Gross Spend</Text>
            </View>
            <Text style={[styles.metricValue, { fontSize: 13, marginTop: 4 }]}>
              {effectiveStats.totalRevenue ?? 'NPR 0'}
            </Text>
          </View>
        </View>

        {/* 3-Way Segment Tabs */}
        <View style={styles.segmentedTabs}>
          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('trips');
            }}
            style={[styles.segmentBtn, activeTab === 'trips' && styles.segmentBtnActive]}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'trips' && styles.segmentBtnTextActive,
              ]}
            >
              Dispatch Desk ({effectiveStats.pendingRequests ?? 0})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('fleet');
            }}
            style={[styles.segmentBtn, activeTab === 'fleet' && styles.segmentBtnActive]}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'fleet' && styles.segmentBtnTextActive,
              ]}
            >
              Fleet Manager ({vehicles.length})
            </Text>
          </Pressable>

          <Pressable
            onPress={() => {
              hapticFeedback.selection();
              setActiveTab('users');
            }}
            style={[styles.segmentBtn, activeTab === 'users' && styles.segmentBtnActive]}
          >
            <Text
              style={[
                styles.segmentBtnText,
                activeTab === 'users' && styles.segmentBtnTextActive,
              ]}
            >
              Users Directory
            </Text>
          </Pressable>
        </View>

        {/* ================= TAB 1: DISPATCH DESK ================= */}
        {activeTab === 'trips' && (
          <View style={styles.sectionContainer}>
            {/* Himalayan Mountain Corridor Advisories Banner / Card */}
            <View style={styles.advisoryCard}>
              <View style={styles.advisoryCardHeader}>
                <View style={styles.advisoryHeaderTitleRow}>
                  <View style={styles.advisoryIconWrap}>
                    <AlertTriangle size={16} color={colors.accent} />
                  </View>
                  <View>
                    <Text style={styles.advisoryCardTitle}>Himalayan Road Bulletins</Text>
                    <Text style={styles.advisoryCardSubtitle}>
                      {advisories.length} active mountain highway condition{advisories.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>

                <View style={styles.advisoryActionRow}>
                  <Pressable
                    onPress={() => {
                      hapticFeedback.selection();
                      setIsAddAdvisoryOpen(true);
                    }}
                    style={({ pressed }) => [styles.postAdvisoryBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Post Himalayan Road Advisory"
                  >
                    <Plus size={14} color={colors.onAccent} />
                    <Text style={styles.postAdvisoryBtnText}>Post</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      hapticFeedback.selection();
                      setIsRoadAdvisoriesExpanded((prev) => !prev);
                    }}
                    style={({ pressed }) => [styles.advisoryToggleBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Toggle road advisory details"
                  >
                    {isRoadAdvisoriesExpanded ? (
                      <ChevronUp size={18} color={colors.subtle} />
                    ) : (
                      <ChevronDown size={18} color={colors.subtle} />
                    )}
                  </Pressable>
                </View>
              </View>

              {/* Advisory list when expanded */}
              {isRoadAdvisoriesExpanded && (
                <View style={styles.advisoriesListContainer}>
                  {advisories.length === 0 ? (
                    <Text style={styles.emptyAdvisoriesText}>No active road advisories. All corridors clear.</Text>
                  ) : (
                    advisories.map((advisory) => {
                      const isCaution = advisory.status === 'caution';
                      const isClosed = advisory.status === 'closed';
                      const statusBg = isClosed ? colors.errorSoft : isCaution ? colors.accentSoft : colors.successSoft;
                      const statusColor = isClosed ? colors.error : isCaution ? colors.accent : colors.success;
                      return (
                        <View key={advisory.id} style={styles.advisoryItem}>
                          <View style={styles.advisoryItemTop}>
                            <Text style={styles.advisoryRouteName}>{advisory.routeName}</Text>
                            <View style={[styles.advisoryStatusBadge, { backgroundColor: statusBg }]}>
                              <View style={[styles.statusDotSmall, { backgroundColor: statusColor }]} />
                              <Text style={[styles.advisoryStatusText, { color: statusColor }]}>
                                {advisory.status.toUpperCase()}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.advisorySummary}>{advisory.conditionSummary}</Text>
                          <View style={styles.advisoryItemBottom}>
                            <Text style={styles.advisoryDate}>
                              Updated: {new Date(advisory.createdAt).toLocaleDateString()}
                            </Text>
                            <Pressable
                              onPress={() => handleDeleteAdvisory(advisory)}
                              style={({ pressed }) => [styles.dismissAdvisoryBtn, pressed && styles.pressed]}
                              accessibilityRole="button"
                              accessibilityLabel={`Dismiss advisory for ${advisory.routeName}`}
                            >
                              <Trash2 size={13} color={colors.error} />
                              <Text style={styles.dismissAdvisoryText}>Dismiss</Text>
                            </Pressable>
                          </View>
                        </View>
                      );
                    })
                  )}
                </View>
              )}
            </View>

            {/* Filter Pills */}
            <View style={styles.filterPillsRow}>
              {(['Pending', 'Confirmed', 'Completed', 'Cancelled', 'All'] as const).map((filter) => (
                <Pressable
                  key={filter}
                  onPress={() => {
                    hapticFeedback.selection();
                    setTripFilter(filter);
                  }}
                  style={[
                    styles.filterPill,
                    tripFilter === filter && styles.filterPillActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.filterPillText,
                      tripFilter === filter && styles.filterPillTextActive,
                    ]}
                  >
                    {filter}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Trip Cards */}
            {filteredTrips.length === 0 ? (
              <View style={styles.emptyState}>
                <CheckCircle2 size={36} color={colors.subtle} />
                <Text style={styles.emptyStateTitle}>No reservations found</Text>
                <Text style={styles.emptyStateDesc}>All incoming trip requests have been handled.</Text>
              </View>
            ) : (
              filteredTrips.map((trip) => (
                <View key={trip.id} style={styles.tripCard}>
                  {/* Card Header */}
                  <View style={styles.tripCardHeader}>
                    <View style={styles.tripCardRefGroup}>
                      <View style={styles.tripRefBadge}>
                        <Text style={styles.tripRefText}>{trip.bookingRef}</Text>
                      </View>
                      <Text style={styles.tripCustomerName}>{trip.customerName}</Text>
                    </View>
                    <View
                      style={[
                        styles.statusTag,
                        trip.status === 'Confirmed' && styles.statusTagConfirmed,
                        trip.status === 'Completed' && styles.statusTagCompleted,
                        trip.status === 'Cancelled' && styles.statusTagCancelled,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDotSmall,
                          trip.status === 'Confirmed' && { backgroundColor: colors.success },
                          trip.status === 'Completed' && { backgroundColor: colors.accent },
                          trip.status === 'Cancelled' && { backgroundColor: colors.error },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusTagText,
                          trip.status === 'Confirmed' && styles.statusTagTextConfirmed,
                          trip.status === 'Completed' && styles.statusTagTextCompleted,
                          trip.status === 'Cancelled' && styles.statusTagTextCancelled,
                        ]}
                      >
                        {trip.status.toUpperCase()}
                      </Text>
                    </View>
                  </View>

                  {/* Customer Phone & Call Action */}
                  <Pressable
                    onPress={() => Linking.openURL(`tel:${trip.customerPhone}`)}
                    style={({ pressed }) => [styles.customerPhoneChip, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel={`Call ${trip.customerName}`}
                  >
                    <View style={styles.phoneIconWrap}>
                      <Phone size={12} color={colors.accent} />
                    </View>
                    <Text style={styles.customerPhoneText}>{trip.customerPhone}</Text>
                    <View style={styles.callBadge}>
                      <Text style={styles.callBadgeText}>CALL</Text>
                    </View>
                  </Pressable>

                  {/* Route Timeline */}
                  <View style={styles.routeTimeline}>
                    <View style={styles.routeVisualCol}>
                      <View style={styles.routeOriginDot} />
                      <View style={styles.routeConnectorLine} />
                      <View style={styles.routeDestDot} />
                    </View>
                    <View style={styles.routeLabelsCol}>
                      <View style={styles.routeStop}>
                        <Text style={styles.routeStopType}>PICKUP</Text>
                        <Text style={styles.routeLocationName} numberOfLines={1}>
                          {trip.pickupLocation}
                        </Text>
                      </View>
                      <View style={styles.routeStopDest}>
                        <Text style={styles.routeStopTypeDest}>DROPOFF</Text>
                        <Text style={styles.routeLocationName} numberOfLines={1}>
                          {trip.dropoffLocation}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Meta Details: Dates, Vehicle Type, Fare */}
                  <View style={styles.tripMetaRow}>
                    <View style={styles.tripMetaItem}>
                      <Calendar size={13} color={colors.subtle} />
                      <Text style={styles.tripMetaText}>
                        {new Date(trip.pickupDate).toLocaleDateString()} • {trip.pickupTime}
                      </Text>
                    </View>
                    <View style={styles.tripMetaItem}>
                      <Car size={13} color={colors.subtle} />
                      <Text style={styles.tripMetaText}>{trip.vehicleCategory}</Text>
                    </View>
                    <View style={styles.fareBadge}>
                      <Text style={styles.fareHighlight}>{trip.estimatedFare}</Text>
                    </View>
                  </View>

                  {/* Assigned Vehicle Display if Confirmed */}
                  {trip.status === 'Confirmed' && trip.assignedVehiclePlate && (
                    <View style={styles.assignedVehicleBanner}>
                      <Car size={14} color={colors.success} />
                      <Text style={styles.assignedVehicleText}>
                        Dispatched: <Text style={{ fontWeight: '800' }}>{trip.assignedVehicleModel}</Text> ({trip.assignedVehiclePlate})
                      </Text>
                    </View>
                  )}

                  {/* Rejection Reason if Cancelled */}
                  {trip.status === 'Cancelled' && trip.rejectionReason && (
                    <View style={styles.rejectionBanner}>
                      <AlertTriangle size={14} color={colors.error} />
                      <Text style={styles.rejectionText}>Reason: {trip.rejectionReason}</Text>
                    </View>
                  )}

                  {/* Action Buttons for Pending trips: Reject or Assign */}
                  {trip.status === 'Pending' && (
                    <View style={styles.actionButtonsRow}>
                      <Pressable
                        onPress={() => {
                          hapticFeedback.selection();
                          setSelectedTripToReject(trip);
                        }}
                        style={({ pressed }) => [styles.rejectBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Reject reservation"
                      >
                        <Text style={styles.rejectBtnText}>Reject</Text>
                      </Pressable>

                      <Pressable
                        onPress={() => {
                          hapticFeedback.selection();
                          setSelectedTripToApprove(trip);
                        }}
                        style={({ pressed }) => [styles.approveBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Approve and dispatch vehicle"
                      >
                        <Car size={14} color={colors.onAccent} style={{ marginRight: 6 }} />
                        <Text style={styles.approveBtnText}>Assign & Dispatch</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Action Buttons for Confirmed trips: Complete Trip & Release Car */}
                  {trip.status === 'Confirmed' && (
                    <View style={styles.actionButtonsRow}>
                      <Pressable
                        onPress={() => handleCompleteTrip(trip)}
                        style={({ pressed }) => [styles.completeTripBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Mark reservation completed and return car"
                      >
                        <CheckCircle2 size={15} color={colors.onAccent} style={{ marginRight: 6 }} />
                        <Text style={styles.completeTripBtnText}>Complete Trip & Release Vehicle</Text>
                      </Pressable>
                    </View>
                  )}

                  {/* Banner if Completed */}
                  {trip.status === 'Completed' && (
                    <View style={styles.completedBanner}>
                      <CheckCircle2 size={14} color={colors.accent} />
                      <Text style={styles.completedBannerText}>
                        Trip Completed • Vehicle returned to active fleet
                      </Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        )}

        {/* ================= TAB 2: FLEET MANAGER ================= */}
        {activeTab === 'fleet' && (
          <View style={styles.sectionContainer}>
            {/* Search Input for Fleet */}
            <View style={styles.searchBar}>
              <Search size={18} color={colors.subtle} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={styles.searchInput}
                value={fleetSearch}
                onChangeText={setFleetSearch}
                placeholder="Search fleet by model or plate..."
                placeholderTextColor={colors.muted}
              />
              {fleetSearch ? (
                <Pressable onPress={() => setFleetSearch('')}>
                  <X size={18} color={colors.subtle} />
                </Pressable>
              ) : null}
            </View>

            {/* Category Filter Chips */}
            <View style={styles.categoryFilterRow}>
              {(['ALL', 'SUV', 'HiAce', 'Sedan', 'Bus'] as const).map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => {
                    hapticFeedback.selection();
                    setFleetCategoryFilter(cat);
                  }}
                  style={[
                    styles.catFilterChip,
                    fleetCategoryFilter === cat && styles.catFilterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catFilterChipText,
                      fleetCategoryFilter === cat && styles.catFilterChipTextActive,
                    ]}
                  >
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Fleet Controls Header */}
            <View style={styles.fleetHeaderRow}>
              <View style={styles.filterPillsRow}>
                {(['all', 'available', 'maintenance'] as const).map((filter) => (
                  <Pressable
                    key={filter}
                    onPress={() => {
                      hapticFeedback.selection();
                      setFleetFilter(filter);
                    }}
                    style={[
                      styles.filterPill,
                      fleetFilter === filter && styles.filterPillActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.filterPillText,
                        fleetFilter === filter && styles.filterPillTextActive,
                      ]}
                    >
                      {filter.toUpperCase()}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setIsAddVehicleOpen(true);
                }}
                style={({ pressed }) => [styles.addVehicleBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Add new fleet vehicle"
              >
                <Plus size={16} color={colors.onAccent} />
                <Text style={styles.addVehicleBtnText}>Add Car</Text>
              </Pressable>
            </View>

            {/* Fleet Cards */}
            {filteredFleet.map((car) => (
              <View key={car.id} style={styles.fleetCard}>
                <View style={styles.fleetCardTop}>
                  <View style={styles.fleetCategoryIconWrap}>
                    {car.category === 'Bus' ? (
                      <Bus size={22} color={colors.accent} />
                    ) : (
                      <Car size={22} color={colors.accent} />
                    )}
                  </View>

                  <View style={styles.fleetDetails}>
                    <Text style={styles.carModel}>{car.model}</Text>
                    <View style={styles.plateTag}>
                      <View style={styles.plateFlag} />
                      <Text style={styles.plateText}>{car.registrationPlate}</Text>
                    </View>
                  </View>

                  <View
                    style={[
                      styles.fleetStatusTag,
                      car.status === 'available' && styles.fleetStatusAvailable,
                      car.status === 'assigned' && styles.fleetStatusAssigned,
                      car.status === 'maintenance' && styles.fleetStatusMaintenance,
                    ]}
                  >
                    <View
                      style={[
                        styles.fleetStatusDot,
                        car.status === 'available' && { backgroundColor: colors.success },
                        car.status === 'assigned' && { backgroundColor: colors.accent },
                        car.status === 'maintenance' && { backgroundColor: colors.error },
                      ]}
                    />
                    <Text style={styles.fleetStatusText}>{car.status.toUpperCase()}</Text>
                  </View>
                </View>

                {/* Specs row: Category, Seats, Fuel */}
                <View style={styles.carSpecsRow}>
                  <Text style={styles.specText}>
                    Class: <Text style={styles.specBold}>{car.category}</Text>
                  </Text>
                  <Text style={styles.specDivider}>•</Text>
                  <Text style={styles.specText}>
                    Capacity: <Text style={styles.specBold}>{car.seats} Seats</Text>
                  </Text>
                  <Text style={styles.specDivider}>•</Text>
                  <Text style={styles.specText}>
                    Fuel: <Text style={styles.specBold}>{car.fuelType}</Text>
                  </Text>
                </View>

                {/* Actions: Maintenance Toggle */}
                <View style={styles.fleetActionsRow}>
                  <Pressable
                    onPress={() => handleToggleMaintenance(car)}
                    style={({ pressed }) => [
                      styles.maintenanceToggleBtn,
                      car.status === 'maintenance' && styles.maintenanceToggleBtnActive,
                      pressed && styles.pressed,
                    ]}
                  >
                    <Wrench size={13} color={car.status === 'maintenance' ? colors.success : colors.subtle} />
                    <Text
                      style={[
                        styles.maintenanceToggleText,
                        car.status === 'maintenance' && { color: colors.success },
                      ]}
                    >
                      {car.status === 'maintenance' ? 'Set as Available' : 'Mark Maintenance'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* ================= TAB 3: USERS DIRECTORY ================= */}
        {activeTab === 'users' && (
          <View style={styles.sectionContainer}>
            {/* Search Input */}
            <View style={styles.searchBar}>
              <Search size={18} color={colors.subtle} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={styles.searchInput}
                value={userSearch}
                onChangeText={setUserSearch}
                placeholder="Search customers by name, phone or email..."
                placeholderTextColor={colors.muted}
              />
              {userSearch ? (
                <Pressable onPress={() => setUserSearch('')}>
                  <X size={18} color={colors.subtle} />
                </Pressable>
              ) : null}
            </View>

            {/* Customers List */}
            {filteredUsers.map((cust) => (
              <Pressable
                key={cust.id}
                onPress={() => handleSelectCustomer(cust)}
                style={({ pressed }) => [styles.userCard, pressed && styles.pressed]}
              >
                <View style={styles.userAvatarCircle}>
                  <Text style={styles.userAvatarLetter}>
                    {cust.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>

                <View style={styles.userInfo}>
                  <Text style={styles.userFullName}>{cust.fullName}</Text>
                  <Text style={styles.userContactText}>{cust.phone}</Text>
                  <Text style={styles.userEmailText}>{cust.email}</Text>
                </View>

                <View style={styles.userStatsCol}>
                  <View style={styles.tripBadge}>
                    <Text style={styles.tripBadgeText}>{cust.totalBookings} Trips</Text>
                  </View>
                  <Text style={styles.userSpend}>{cust.lifetimeSpend}</Text>
                  <ChevronRight size={16} color={colors.subtle} style={{ alignSelf: 'flex-end', marginTop: 4 }} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* ================= MODAL: DISPATCH / ASSIGN VEHICLE ================= */}
      <Modal
        visible={!!selectedTripToApprove}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedTripToApprove(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Dispatch Vehicle</Text>
                <Text style={styles.modalSubtitle}>
                  Select available car for {selectedTripToApprove?.bookingRef}
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedTripToApprove(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSectionLabel}>Available Fleet Vehicles</Text>

            <ScrollView style={{ maxHeight: 280 }}>
              {vehicles
                .filter((v) => v.status === 'available')
                .map((car) => (
                  <Pressable
                    key={car.id}
                    disabled={isSubmittingDispatch}
                    onPress={() => handleApproveWithVehicle(car.id)}
                    style={({ pressed }) => [styles.vehicleOptionCard, pressed && styles.pressed]}
                  >
                    <View style={styles.vehicleOptionIcon}>
                      <Car size={20} color={colors.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.vehicleOptionModel}>{car.model}</Text>
                      <Text style={styles.vehicleOptionPlate}>
                        {car.registrationPlate} • {car.category} ({car.seats} seats)
                      </Text>
                    </View>
                    <View style={styles.dispatchSelectBtn}>
                      <Text style={styles.dispatchSelectBtnText}>Assign</Text>
                    </View>
                  </Pressable>
                ))}
            </ScrollView>

            {isSubmittingDispatch && (
              <View style={styles.modalLoading}>
                <ActivityIndicator color={colors.accent} />
                <Text style={styles.modalLoadingText}>Processing assignment transaction...</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: REJECT RESERVATION ================= */}
      <Modal
        visible={!!selectedTripToReject}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedTripToReject(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Reject Reservation</Text>
              <Pressable
                onPress={() => setSelectedTripToReject(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSubtitle}>
              Please provide a reason for cancelling reservation{' '}
              {selectedTripToReject?.bookingRef}. The customer will be notified immediately.
            </Text>

            <TextInput
              style={styles.rejectionInput}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="e.g., Road closure on BP Highway, No vehicles available in this category..."
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalActionsRow}>
              <Pressable
                onPress={() => setSelectedTripToReject(null)}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>

              <Pressable
                onPress={handleConfirmReject}
                disabled={isSubmittingDispatch}
                style={[styles.confirmRejectBtn, isSubmittingDispatch && { opacity: 0.6 }]}
              >
                <Text style={styles.confirmRejectText}>Confirm Rejection</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: REGISTER VEHICLE ================= */}
      <Modal
        visible={isAddVehicleOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddVehicleOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Register New Vehicle</Text>
              <Pressable
                onPress={() => setIsAddVehicleOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vehicle Model Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={newVehicle.model}
                  onChangeText={(val) => setNewVehicle({ ...newVehicle, model: val })}
                  placeholder="e.g., Mahindra Scorpio S11 4x4"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Registration Plate Number</Text>
                <TextInput
                  style={styles.formInput}
                  value={newVehicle.registrationPlate}
                  onChangeText={(val) => setNewVehicle({ ...newVehicle, registrationPlate: val })}
                  placeholder="e.g., BA 2 PA 9988"
                  placeholderTextColor={colors.muted}
                  autoCapitalize="characters"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Category</Text>
                <View style={styles.categoryPickerRow}>
                  {(['SUV', 'Sedan', 'HiAce', 'Bus'] as const).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setNewVehicle({ ...newVehicle, category: cat })}
                      style={[
                        styles.catOption,
                        newVehicle.category === cat && styles.catOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          newVehicle.category === cat && styles.catOptionTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>Capacity (Seats)</Text>
                  <TextInput
                    style={styles.formInput}
                    value={String(newVehicle.seats)}
                    onChangeText={(val) =>
                      setNewVehicle({ ...newVehicle, seats: Number(val) || 4 })
                    }
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Fuel Type</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newVehicle.fuelType}
                    onChangeText={(val) => setNewVehicle({ ...newVehicle, fuelType: val })}
                    placeholder="Diesel / Petrol / EV"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>
            </ScrollView>

            <Pressable
              onPress={handleCreateVehicle}
              style={styles.createVehicleSubmitBtn}
            >
              <Text style={styles.createVehicleSubmitText}>Save to Fleet Inventory</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: POST ROAD ADVISORY ================= */}
      <Modal
        visible={isAddAdvisoryOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddAdvisoryOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Himalayan Road Bulletin</Text>
                <Text style={styles.modalSubtitle}>Post mountain highway condition advisory</Text>
              </View>
              <Pressable
                onPress={() => setIsAddAdvisoryOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 380 }}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Highway / Corridor Name</Text>
                <TextInput
                  style={styles.formInput}
                  value={newAdvisory.routeName}
                  onChangeText={(val) => setNewAdvisory({ ...newAdvisory, routeName: val })}
                  placeholder="e.g., BP Highway (Golanjor - Khurkot)"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Road Status</Text>
                <View style={styles.categoryPickerRow}>
                  {(['open', 'caution', 'closed'] as const).map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => {
                        hapticFeedback.selection();
                        setNewAdvisory({ ...newAdvisory, status: st });
                      }}
                      style={[
                        styles.catOption,
                        newAdvisory.status === st && styles.catOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          newAdvisory.status === st && styles.catOptionTextActive,
                        ]}
                      >
                        {st.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Severity Level</Text>
                <View style={styles.categoryPickerRow}>
                  {(['info', 'moderate', 'severe'] as const).map((sev) => (
                    <Pressable
                      key={sev}
                      onPress={() => {
                        hapticFeedback.selection();
                        setNewAdvisory({ ...newAdvisory, severity: sev });
                      }}
                      style={[
                        styles.catOption,
                        newAdvisory.severity === sev && styles.catOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          newAdvisory.severity === sev && styles.catOptionTextActive,
                        ]}
                      >
                        {sev.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Condition Summary & Details</Text>
                <TextInput
                  style={styles.rejectionInput}
                  value={newAdvisory.conditionSummary}
                  onChangeText={(val) => setNewAdvisory({ ...newAdvisory, conditionSummary: val })}
                  placeholder="e.g., Landslide clearing at Golanjor; single lane alternating traffic. 4x4 recommended."
                  placeholderTextColor={colors.muted}
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <Pressable
              onPress={handleCreateAdvisory}
              disabled={isSubmittingAdvisory}
              style={[styles.createVehicleSubmitBtn, isSubmittingAdvisory && { opacity: 0.6 }]}
            >
              {isSubmittingAdvisory ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={styles.createVehicleSubmitText}>Publish Road Bulletin</Text>
              )}
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* ================= MODAL: CUSTOMER TRIP HISTORY ================= */}
      <Modal
        visible={!!selectedCustomer}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedCustomer(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{selectedCustomer?.fullName}</Text>
                <Text style={styles.modalSubtitle}>
                  {selectedCustomer?.phone} • {selectedCustomer?.totalBookings} Total Reservations
                </Text>
              </View>
              <Pressable
                onPress={() => setSelectedCustomer(null)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <Text style={styles.modalSectionLabel}>Trip Reservation History</Text>

            {loadingCustomerTrips ? (
              <ActivityIndicator color={colors.accent} style={{ marginVertical: spacing.xl }} />
            ) : customerTrips.length === 0 ? (
              <Text style={styles.emptyHistoryText}>No reservations on record for this customer.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {customerTrips.map((tr) => (
                  <View key={tr.bookingId} style={styles.customerHistoryCard}>
                    <View style={styles.historyTopRow}>
                      <Text style={styles.historyRef}>{tr.bookingRef}</Text>
                      <Text style={styles.historyFare}>{tr.estimatedFare}</Text>
                    </View>
                    <Text style={styles.historyRoute}>
                      {tr.pickupLocation} → {tr.dropoffLocation}
                    </Text>
                    <Text style={styles.historyDate}>
                      Date: {new Date(tr.pickupDate).toLocaleDateString()} • Status: {tr.status}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    badgeShield: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerBrand: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.2,
    },
    headerAdminName: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '500',
    },
    headerRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    rlsPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.successSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.success,
    },
    rlsDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
      marginRight: 4,
    },
    rlsText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.success,
      letterSpacing: 0.5,
    },
    logoutBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.sm,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    pressed: {
      opacity: 0.75,
    },
    scrollContent: {
      paddingBottom: spacing.xxl,
    },
    metricsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      padding: spacing.md,
      gap: spacing.sm,
    },
    metricCard: {
      flex: 1,
      minWidth: '47%',
      backgroundColor: colors.surface,
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    },
    metricCardAlert: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    metricTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    metricIconWrap: {
      width: 28,
      height: 28,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
    },
    metricLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subtle,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    metricValue: {
      fontSize: 22,
      fontWeight: '800',
      color: colors.text,
      marginTop: spacing.xs,
    },
    segmentedTabs: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: 3,
      borderWidth: 1,
      borderColor: colors.border,
    },
    segmentBtn: {
      flex: 1,
      paddingVertical: spacing.sm,
      alignItems: 'center',
      borderRadius: radius.sm,
    },
    segmentBtnActive: {
      backgroundColor: colors.accent,
    },
    segmentBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subtle,
    },
    segmentBtnTextActive: {
      color: colors.onAccent,
    },
    sectionContainer: {
      paddingHorizontal: spacing.md,
    },
    filterPillsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    filterPill: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 1,
      borderRadius: radius.pill,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    filterPillActive: {
      backgroundColor: colors.navySoft,
      borderColor: colors.navySoft,
    },
    filterPillText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subtle,
    },
    filterPillTextActive: {
      color: colors.onNavy,
    },
    advisoryCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 4,
      elevation: 2,
    },
    advisoryCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    advisoryHeaderTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    advisoryIconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    advisoryCardTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
    },
    advisoryCardSubtitle: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '500',
    },
    advisoryActionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    postAdvisoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: radius.sm,
    },
    postAdvisoryBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.onAccent,
    },
    advisoryToggleBtn: {
      width: 28,
      height: 28,
      borderRadius: 14,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    advisoriesListContainer: {
      marginTop: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      gap: spacing.sm,
    },
    emptyAdvisoriesText: {
      fontSize: 12,
      color: colors.subtle,
      fontStyle: 'italic',
      textAlign: 'center',
      paddingVertical: spacing.sm,
    },
    advisoryItem: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    advisoryItemTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    advisoryRouteName: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
      marginRight: spacing.sm,
    },
    advisoryStatusBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    advisoryStatusText: {
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 0.5,
    },
    advisorySummary: {
      fontSize: 12,
      color: colors.subtle,
      lineHeight: 16,
      marginBottom: 6,
    },
    advisoryItemBottom: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 4,
    },
    advisoryDate: {
      fontSize: 10,
      color: colors.muted,
    },
    dismissAdvisoryBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
    },
    dismissAdvisoryText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.error,
    },
    emptyState: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xxl,
    },
    emptyStateTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.sm,
    },
    emptyStateDesc: {
      fontSize: 13,
      color: colors.subtle,
      marginTop: 2,
    },
    tripCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    tripCardHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    tripCardRefGroup: {
      flexDirection: 'column',
      gap: 2,
    },
    tripRefBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.sm,
      marginBottom: 2,
    },
    tripRefText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.6,
    },
    tripCustomerName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    statusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      backgroundColor: colors.accentSoft,
    },
    statusTagConfirmed: {
      backgroundColor: colors.successSoft,
    },
    statusTagCompleted: {
      backgroundColor: colors.navySoft,
    },
    statusTagCancelled: {
      backgroundColor: colors.errorSoft,
    },
    statusDotSmall: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
      marginRight: 4,
    },
    statusTagText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
    },
    statusTagTextConfirmed: {
      color: colors.success,
    },
    statusTagTextCompleted: {
      color: colors.onNavy,
    },
    statusTagTextCancelled: {
      color: colors.error,
    },
    customerPhoneChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      alignSelf: 'flex-start',
      borderWidth: 1,
      borderColor: colors.border,
      marginVertical: spacing.xs,
      gap: 6,
    },
    phoneIconWrap: {
      width: 18,
      height: 18,
      borderRadius: 9,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    customerPhoneText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text,
    },
    callBadge: {
      backgroundColor: colors.accent,
      paddingHorizontal: 5,
      paddingVertical: 1,
      borderRadius: radius.pill,
    },
    callBadgeText: {
      fontSize: 8,
      fontWeight: '800',
      color: colors.onAccent,
      letterSpacing: 0.5,
    },
    routeTimeline: {
      flexDirection: 'row',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.md,
      marginVertical: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    routeVisualCol: {
      alignItems: 'center',
      width: 14,
      marginRight: spacing.sm,
      paddingVertical: 3,
    },
    routeOriginDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.accent,
    },
    routeConnectorLine: {
      width: 2,
      flex: 1,
      backgroundColor: colors.border,
      marginVertical: 2,
    },
    routeDestDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.success,
    },
    routeLabelsCol: {
      flex: 1,
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    routeStop: {
      justifyContent: 'center',
    },
    routeStopDest: {
      justifyContent: 'center',
    },
    routeStopType: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
      marginBottom: 1,
    },
    routeStopTypeDest: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.success,
      letterSpacing: 0.5,
      marginBottom: 1,
    },
    routeLocationName: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
    },
    tripMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    tripMetaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    tripMetaText: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '500',
    },
    fareBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    fareHighlight: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
    },
    assignedVehicleBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.successSoft,
      padding: spacing.sm,
      borderRadius: radius.sm,
      marginTop: spacing.xs,
    },
    assignedVehicleText: {
      fontSize: 12,
      color: colors.success,
      fontWeight: '600',
    },
    rejectionBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.errorSoft,
      padding: spacing.sm,
      borderRadius: radius.sm,
      marginTop: spacing.xs,
    },
    rejectionText: {
      fontSize: 12,
      color: colors.error,
      fontWeight: '600',
    },
    actionButtonsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    rejectBtn: {
      flex: 1,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.errorSoft,
    },
    rejectBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.error,
    },
    approveBtn: {
      flex: 2,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      flexDirection: 'row',
    },
    approveBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.onAccent,
    },
    completeTripBtn: {
      flex: 1,
      height: 40,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.navySoft,
      flexDirection: 'row',
    },
    completeTripBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.onNavy,
    },
    completedBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.accentSoft,
      padding: spacing.sm,
      borderRadius: radius.sm,
      marginTop: spacing.xs,
    },
    completedBannerText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },
    categoryFilterRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    catFilterChip: {
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
    },
    catFilterChipActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    catFilterChipText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.5,
    },
    catFilterChipTextActive: {
      color: colors.onAccent,
    },
    fleetHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    addVehicleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.md,
      gap: 4,
    },
    addVehicleBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.onAccent,
    },
    fleetCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    fleetCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    fleetCategoryIconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    fleetDetails: {
      flex: 1,
    },
    carModel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    plateTag: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      alignSelf: 'flex-start',
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
      marginTop: 4,
    },
    plateFlag: {
      width: 4,
      height: 10,
      borderRadius: 2,
      backgroundColor: colors.error,
      marginRight: 6,
    },
    plateText: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: 0.8,
    },
    fleetStatusTag: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    fleetStatusAvailable: {
      backgroundColor: colors.successSoft,
    },
    fleetStatusAssigned: {
      backgroundColor: colors.accentSoft,
    },
    fleetStatusMaintenance: {
      backgroundColor: colors.errorSoft,
    },
    fleetStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.success,
      marginRight: 4,
    },
    fleetStatusText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.text,
    },
    carSpecsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    specText: {
      fontSize: 11,
      color: colors.subtle,
    },
    specBold: {
      fontWeight: '700',
      color: colors.text,
    },
    specDivider: {
      marginHorizontal: spacing.sm,
      color: colors.border,
    },
    fleetActionsRow: {
      marginTop: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'flex-end',
    },
    maintenanceToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.elevated,
    },
    maintenanceToggleBtnActive: {
      backgroundColor: colors.successSoft,
    },
    maintenanceToggleText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subtle,
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      height: 44,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text,
    },
    userCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    userAvatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.navySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    userAvatarLetter: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.onNavy,
    },
    userInfo: {
      flex: 1,
    },
    userFullName: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
    },
    userContactText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },
    userEmailText: {
      fontSize: 11,
      color: colors.subtle,
    },
    userStatsCol: {
      alignItems: 'flex-end',
    },
    tripBadge: {
      backgroundColor: colors.accentSoft,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginBottom: 2,
    },
    tripBadgeText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
    },
    userSpend: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    // Modals
    modalOverlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.xl,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xl,
      maxHeight: '85%',
    },
    sheetHandle: {
      width: 36,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.border,
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.md,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.text,
    },
    modalSubtitle: {
      fontSize: 12,
      color: colors.subtle,
      marginTop: 2,
    },
    modalCloseBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalSectionLabel: {
      fontSize: 12,
      fontWeight: '800',
      color: colors.accent,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.sm,
    },
    vehicleOptionCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    vehicleOptionIcon: {
      marginRight: spacing.sm,
    },
    vehicleOptionModel: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.text,
    },
    vehicleOptionPlate: {
      fontSize: 11,
      color: colors.subtle,
    },
    dispatchSelectBtn: {
      backgroundColor: colors.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 6,
      borderRadius: radius.sm,
    },
    dispatchSelectBtnText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.onAccent,
    },
    modalLoading: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      marginTop: spacing.md,
    },
    modalLoadingText: {
      fontSize: 12,
      color: colors.accent,
      fontWeight: '600',
    },
    rejectionInput: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      fontSize: 13,
      color: colors.text,
      textAlignVertical: 'top',
      marginVertical: spacing.md,
    },
    modalActionsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    cancelBtn: {
      flex: 1,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.elevated,
    },
    cancelBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.subtle,
    },
    confirmRejectBtn: {
      flex: 1,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.error,
    },
    confirmRejectText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.onAccent,
    },
    formGroup: {
      marginBottom: spacing.md,
    },
    formLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    formInput: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      height: 44,
      fontSize: 13,
      color: colors.text,
    },
    formRow: {
      flexDirection: 'row',
    },
    categoryPickerRow: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    catOption: {
      flex: 1,
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: colors.elevated,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    catOptionActive: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
    },
    catOptionText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subtle,
    },
    catOptionTextActive: {
      color: colors.onAccent,
    },
    createVehicleSubmitBtn: {
      backgroundColor: colors.accent,
      height: 48,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
    },
    createVehicleSubmitText: {
      fontSize: 14,
      fontWeight: '700',
      color: colors.onAccent,
    },
    emptyHistoryText: {
      fontSize: 13,
      color: colors.subtle,
      paddingVertical: spacing.lg,
      textAlign: 'center',
    },
    customerHistoryCard: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    historyTopRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 2,
    },
    historyRef: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
    },
    historyFare: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    historyRoute: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
    },
    historyDate: {
      fontSize: 11,
      color: colors.subtle,
    },
  });
}
