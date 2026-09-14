import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  Bell,
  Bus,
  Calendar,
  CalendarCheck,
  Car,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  Clock,
  Compass,
  Copy,
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
  MessageCircle,
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
import * as Clipboard from 'expo-clipboard';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  approveAdminTrip,
  completeAdminTrip,
  createAdminDriver,
  createAdminVehicle,
  getAdminDrivers,
  getAdminStats,
  getAdminTrips,
  getAdminUsers,
  getAdminVehicles,
  getCustomerTrips,
  rejectAdminTrip,
  updateAdminDriver,
  updateAdminVehicle,
} from '../../api/admin';
import { AdminNotificationsModal } from './AdminNotificationsModal';
import { ThemeModeSelector } from '../../components/ui/ThemeModeSelector';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { AuthContext } from '../../context/AuthContext';
import { navigationRef } from '../../navigation/navigationRef';
import { useTheme } from '../../theme/ThemeProvider';
import { useThemedStyles } from '../../theme/useThemedStyles';
import type { ThemeColors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';
import { typography } from '../../theme/typography';
import type {
  AdminCustomer,
  AdminDriver,
  AdminStats,
  AdminTrip,
  AdminVehicle,
  CreateDriverDto,
  CreateVehicleDto,
  CustomerTripHistory,
  UpdateDriverDto,
} from '../../types/admin';
import { hapticFeedback } from '../../utils/haptics';
import { getOfflineVouchers, saveOfflineVouchers } from '../../utils/offlineVoucherStorage';

type TabType = 'trips' | 'drivers' | 'fleet' | 'users' | 'profile';

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
  const [drivers, setDrivers] = useState<AdminDriver[]>([]);

  // Filtering states
  const [tripFilter, setTripFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Completed' | 'Cancelled'>('Pending');
  const [tripSearch, setTripSearch] = useState<string>('');
  const [driverStatusFilter, setDriverStatusFilter] = useState<'ALL' | 'ACTIVE' | 'PENDING' | 'INACTIVE'>('ALL');
  const [driverSearch, setDriverSearch] = useState<string>('');
  const [userSearch, setUserSearch] = useState<string>('');

  // Modals
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState<boolean>(false);
  const [selectedTripToApprove, setSelectedTripToApprove] = useState<AdminTrip | null>(null);
  const [selectedTripToReject, setSelectedTripToReject] = useState<AdminTrip | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [isSubmittingDispatch, setIsSubmittingDispatch] = useState<boolean>(false);

  // Enhanced Trip Inspection & WhatsApp Dispatch State
  const [inspectedTrip, setInspectedTrip] = useState<AdminTrip | null>(null);
  const [dispatchVehicleId, setDispatchVehicleId] = useState<number | null>(null);
  const [dispatchDriverId, setDispatchDriverId] = useState<number | null>(null);
  const [dispatchPrice, setDispatchPrice] = useState<string>('');
  const [copiedWhatsAppToast, setCopiedWhatsAppToast] = useState<boolean>(false);

  const [isAddDriverOpen, setIsAddDriverOpen] = useState<boolean>(false);
  const [isSubmittingDriver, setIsSubmittingDriver] = useState<boolean>(false);
  const [newDriver, setNewDriver] = useState<CreateDriverDto>({
    fullName: '',
    phoneNumber: '',
    whatsappNumber: '',
    email: '',
    citizenshipOrIdNo: '',
    status: 'active',
    citizenshipDocId: '',
    licenseDocId: '',
    makeModel: '',
    licensePlate: '',
    category: 'SUV',
    vehicleTypeId: 2,
    seatingCapacity: 7,
    manufactureYear: 2022,
    color: 'White',
    bluebookDocId: '',
  });

  const [selectedCustomer, setSelectedCustomer] = useState<AdminCustomer | null>(null);
  const [customerTrips, setCustomerTrips] = useState<CustomerTripHistory[]>([]);
  const [loadingCustomerTrips, setLoadingCustomerTrips] = useState<boolean>(false);

  const loadAllData = useCallback(async () => {
    try {
      const [statsRes, tripsRes, fleetRes, usersRes, driversRes] = await Promise.all([
        getAdminStats(),
        getAdminTrips(),
        getAdminVehicles(),
        getAdminUsers(),
        getAdminDrivers(),
      ]);

      if (statsRes) setStats(statsRes);
      if (Array.isArray(tripsRes)) setTrips(tripsRes);
      if (Array.isArray(fleetRes)) setVehicles(fleetRes);
      if (Array.isArray(usersRes)) setUsers(usersRes);
      if (Array.isArray(driversRes)) setDrivers(driversRes);
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
      try {
        await logout();
      } catch (err) {
        console.warn('[AdminDashboard] Error during logout:', err);
      }
      if (authCtx?.signOut) {
        try {
          await authCtx.signOut();
        } catch {
          // safely continue
        }
      }
      if (navigationRef.isReady()) {
        try {
          navigationRef.resetRoot({
            index: 0,
            routes: [{ name: 'Auth' }],
          });
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
  // DISPATCH DESK ACTIONS & WHATSAPP FORMATTER
  // ----------------------------------------------------
  const getDriverVehicle = useCallback(
    (driver: AdminDriver | null | undefined): {
      id: number;
      model: string;
      plate: string;
      category?: string;
      seats?: number;
    } | null => {
      if (!driver) return null;
      if (driver.vehicle) {
        return {
          id: driver.vehicle.id || driver.vehicle.vehicleId,
          model: driver.vehicle.makeModel,
          plate: driver.vehicle.licensePlate,
          category: driver.vehicle.category,
          seats: driver.vehicle.seatingCapacity,
        };
      }
      const matched = vehicles.find((v) => v.ownerId === driver.ownerId || v.ownerId === driver.id);
      if (matched) {
        return {
          id: matched.id,
          model: matched.model,
          plate: matched.registrationPlate,
          category: matched.category,
          seats: matched.seats,
        };
      }
      return null;
    },
    [vehicles],
  );

  const selectedDriver = useMemo(() => {
    return drivers.find((d) => (d.id || d.ownerId) === dispatchDriverId) || null;
  }, [drivers, dispatchDriverId]);

  const selectedDriverVehicle = useMemo(() => {
    return getDriverVehicle(selectedDriver);
  }, [getDriverVehicle, selectedDriver]);

  const resolvedTargetVehicle = useMemo(() => {
    if (dispatchVehicleId) {
      const found = vehicles.find((v) => v.id === dispatchVehicleId);
      if (found) return found;
    }
    if (selectedDriverVehicle) {
      return {
        id: selectedDriverVehicle.id,
        vehicleTypeId: 2,
        model: selectedDriverVehicle.model,
        registrationPlate: selectedDriverVehicle.plate,
        category: (selectedDriverVehicle.category as any) || 'SUV',
        seats: selectedDriverVehicle.seats || 7,
        fuelType: 'Diesel',
        imageUrl: '',
        status: 'available' as const,
        createdAt: '',
        updatedAt: '',
      };
    }
    return null;
  }, [dispatchVehicleId, vehicles, selectedDriverVehicle]);

  const openTripInspection = (trip: AdminTrip) => {
    hapticFeedback.selection();
    setInspectedTrip(trip);
    setDispatchDriverId(trip.assignedDriverId || null);
    if (trip.assignedVehicleId) {
      setDispatchVehicleId(trip.assignedVehicleId);
    } else if (trip.assignedDriverId) {
      const drv = drivers.find((d) => (d.id || d.ownerId) === trip.assignedDriverId);
      const owned = getDriverVehicle(drv);
      setDispatchVehicleId(owned ? owned.id : null);
    } else {
      setDispatchVehicleId(null);
    }
    setDispatchPrice(trip.finalFare || trip.estimatedFare || '');
  };

  const handleSelectDriver = (drv: AdminDriver) => {
    hapticFeedback.selection();
    const drvId = drv.id || drv.ownerId;
    const isSelected = dispatchDriverId === drvId;
    if (isSelected) {
      setDispatchDriverId(null);
      setDispatchVehicleId(null);
    } else {
      setDispatchDriverId(drvId);
      const owned = getDriverVehicle(drv);
      setDispatchVehicleId(owned ? owned.id : null);
    }
  };

  const formatWhatsAppDispatchMessage = (
    trip: AdminTrip,
    vehicle?: AdminVehicle | null,
    driver?: AdminDriver | null,
    price?: string,
  ): string => {
    const tripDate = new Date(trip.pickupDate).toLocaleDateString('en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
    const assignedCar = vehicle
      ? `${vehicle.model} (${vehicle.registrationPlate})`
      : trip.assignedVehiclePlate
        ? `${trip.assignedVehicleModel || 'Vehicle'} (${trip.assignedVehiclePlate})`
        : 'Vehicle TBD (Dispatch in Progress)';
    const assignedDrv = driver
      ? `${driver.fullName} (${driver.phoneNumber})`
      : trip.assignedDriverName
        ? `${trip.assignedDriverName} (${trip.assignedDriverPhone || ''})`
        : 'Driver TBD (Dispatch in Progress)';
    const fareStr = price?.trim() || trip.finalFare || trip.estimatedFare || 'NPR 12,000';

    return `🇳🇵 *DRIVE KENDRA — TRIP DISPATCH RESERVATION*
━━━━━━━━━━━━━━━━━━━━━━━━
📋 *Booking Ref:* ${trip.bookingRef}
📅 *Pickup Date:* ${tripDate} at ${trip.pickupTime || '07:00 AM'}
🔄 *Trip Type:* ${trip.tripType}
👥 *Passengers:* ${trip.passengerCount} Pax

👤 *Customer:* ${trip.customerName}
📞 *Customer Phone:* ${trip.customerPhone}

📍 *Pickup:* ${trip.pickupLocation}
🏁 *Dropoff:* ${trip.dropoffLocation}
💬 *Customer Notes:* ${trip.additionalDetails || 'Standard Himalayan expedition route'}

━━━━━━━━━━━━━━━━━━━━━━━━
🚙 *Assigned Vehicle:* ${assignedCar}
🧑‍✈️ *Assigned Driver:* ${assignedDrv}
💵 *Agreed Fare:* ${fareStr}
━━━━━━━━━━━━━━━━━━━━━━━━
📞 *Kathmandu 24/7 Dispatch Desk:* +977 985-1363783
🚨 *Tourist Police Emergency:* 1144`;
  };

  const handleCopyWhatsApp = async () => {
    if (!inspectedTrip) return;
    const text = formatWhatsAppDispatchMessage(inspectedTrip, resolvedTargetVehicle, selectedDriver, dispatchPrice);

    try {
      await Clipboard.setStringAsync(text);
    } catch {
      if (typeof navigator !== 'undefined' && (navigator as any).clipboard) {
        await (navigator as any).clipboard.writeText(text).catch(() => {});
      }
    }
    hapticFeedback.success();
    setCopiedWhatsAppToast(true);
    setTimeout(() => setCopiedWhatsAppToast(false), 3000);
  };

  const handleOpenWhatsApp = () => {
    if (!inspectedTrip) return;
    const text = formatWhatsAppDispatchMessage(inspectedTrip, resolvedTargetVehicle, selectedDriver, dispatchPrice);
    const encoded = encodeURIComponent(text);
    Linking.openURL(`https://wa.me/?text=${encoded}`).catch(() => {
      Alert.alert('Notice', 'Unable to open WhatsApp on this device.');
    });
  };

  const handleConfirmDispatch = async () => {
    if (!inspectedTrip) return;
    const targetDriver = selectedDriver || drivers.find((d) => (d.id || d.ownerId) === dispatchDriverId);

    if (!targetDriver) {
      hapticFeedback.error();
      Alert.alert('Driver Required', 'Please select an active driver to dispatch this reservation.');
      return;
    }

    const driverVehicle = selectedDriverVehicle || getDriverVehicle(targetDriver);
    let resolvedVehicleId = dispatchVehicleId || driverVehicle?.id || undefined;
    let targetVehicle = resolvedTargetVehicle || (resolvedVehicleId ? vehicles.find((v) => v.id === resolvedVehicleId) : null);

    if (!targetVehicle && driverVehicle) {
      resolvedVehicleId = driverVehicle.id;
      targetVehicle = {
        id: driverVehicle.id,
        vehicleTypeId: 2,
        model: driverVehicle.model,
        registrationPlate: driverVehicle.plate,
        category: (driverVehicle.category as any) || 'SUV',
        seats: driverVehicle.seats || 7,
        fuelType: 'Diesel',
        imageUrl: '',
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!resolvedVehicleId && !driverVehicle) {
      hapticFeedback.error();
      Alert.alert(
        'Vehicle Required',
        `The selected driver (${targetDriver.fullName}) does not have an attached vehicle registered. Please attach a vehicle to this driver in the Drivers Directory first.`,
      );
      return;
    }

    setIsSubmittingDispatch(true);
    try {
      const finalFareVal = dispatchPrice.trim() || inspectedTrip.finalFare || inspectedTrip.estimatedFare || 'NPR 12,000';
      await approveAdminTrip(inspectedTrip.id, {
        vehicleId: resolvedVehicleId,
        driverId: targetDriver.id || targetDriver.ownerId,
        driverName: targetDriver.fullName,
        driverPhone: targetDriver.phoneNumber,
        finalPrice: finalFareVal,
      });

      hapticFeedback.success();

      // Update local state
      setTrips((prev) =>
        prev.map((t) =>
          t.id === inspectedTrip.id
            ? {
                ...t,
                status: 'Confirmed',
                assignedVehicleId: resolvedVehicleId || null,
                assignedVehiclePlate: targetVehicle?.registrationPlate || (driverVehicle?.plate || null),
                assignedVehicleModel: targetVehicle?.model || (driverVehicle?.model || null),
                assignedDriverId: targetDriver.id || targetDriver.ownerId,
                assignedDriverName: targetDriver.fullName,
                assignedDriverPhone: targetDriver.phoneNumber,
                finalFare: finalFareVal,
              }
            : t,
        ),
      );

      // Update vehicle status in local state if vehicle was assigned
      if (resolvedVehicleId) {
        setVehicles((prev) =>
          prev.map((v) => (v.id === resolvedVehicleId ? { ...v, status: 'assigned' } : v)),
        );
      }

      const ref = inspectedTrip.bookingRef;
      const cust = inspectedTrip.customerName;

      // Also synchronize offline voucher storage for local persistence / testing
      try {
        const cachedVouchers = await getOfflineVouchers();
        if (cachedVouchers && cachedVouchers.length > 0) {
          const updated = cachedVouchers.map((cv) => {
            if (cv.bookingRef === ref || cv.id === `trip_${inspectedTrip.id}`) {
              return {
                ...cv,
                status: 'confirmed' as const,
                vehiclePlate: targetVehicle?.registrationPlate || driverVehicle?.plate || 'Assigned Fleet',
                vehicleName: targetVehicle ? `${targetVehicle.model} (AC)` : (driverVehicle?.model || cv.vehicleName),
                driverName: targetDriver.fullName,
                driverPhone: targetDriver.phoneNumber,
                fare: finalFareVal,
                finalFare: finalFareVal,
              };
            }
            return cv;
          });
          await saveOfflineVouchers(updated);
        }
      } catch (cacheErr) {
        console.warn('[AdminDashboard] Failed to sync offline voucher:', cacheErr);
      }

      setInspectedTrip(null);
      setSelectedTripToApprove(null);
      Alert.alert(
        'Dispatch Confirmed',
        `Trip ${ref} has been confirmed and dispatched to ${cust} with driver & vehicle details.`,
      );
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Could not confirm dispatch.';
      Alert.alert('Dispatch Error', msg);
    } finally {
      setIsSubmittingDispatch(false);
    }
  };

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

  // ----------------------------------------------------
  // DRIVERS DIRECTORY ACTIONS
  // ----------------------------------------------------
  const handleToggleDriverStatus = async (driver: AdminDriver) => {
    hapticFeedback.selection();
    const newStatus = driver.status === 'active' ? 'inactive' : 'active';
    try {
      await updateAdminDriver(driver.id, { status: newStatus });
      hapticFeedback.success();
      await loadAllData();
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Could not toggle driver status.';
      Alert.alert('Update Failed', msg);
    }
  };

  const handleCreateDriver = async () => {
    if (!newDriver.fullName.trim()) {
      hapticFeedback.error();
      Alert.alert('Missing Name', 'Driver full legal name is required.');
      return;
    }
    if (!newDriver.phoneNumber.trim()) {
      hapticFeedback.error();
      Alert.alert('Missing Phone', 'Driver contact phone number is required.');
      return;
    }
    if (!newDriver.citizenshipOrIdNo.trim()) {
      hapticFeedback.error();
      Alert.alert('Missing ID', 'Citizenship or National ID number is required.');
      return;
    }
    if (!newDriver.licenseDocId.trim()) {
      hapticFeedback.error();
      Alert.alert('Missing License', 'Driving license document ID is required.');
      return;
    }

    setIsSubmittingDriver(true);
    try {
      await createAdminDriver(newDriver);
      hapticFeedback.success();
      setIsAddDriverOpen(false);
      setNewDriver({
        fullName: '',
        phoneNumber: '',
        whatsappNumber: '',
        email: '',
        citizenshipOrIdNo: '',
        status: 'active',
        citizenshipDocId: '',
        licenseDocId: '',
        makeModel: '',
        licensePlate: '',
        category: 'SUV',
        vehicleTypeId: 2,
        seatingCapacity: 7,
        manufactureYear: 2022,
        color: 'White',
        bluebookDocId: '',
      });
      await loadAllData();
      Alert.alert(
        'Driver & Vehicle Registered',
        'New driver profile (dka_owners) and vehicle (dka_vehicles) registered and synchronized into partner database.',
      );
    } catch (err: unknown) {
      hapticFeedback.error();
      const msg = err instanceof Error ? err.message : 'Could not register driver and vehicle profile.';
      Alert.alert('Registration Failed', msg);
    } finally {
      setIsSubmittingDriver(false);
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
    if (tripFilter !== 'All' && t.status.toLowerCase() !== tripFilter.toLowerCase()) {
      return false;
    }
    if (tripSearch.trim()) {
      const q = tripSearch.toLowerCase().trim();
      return (
        t.customerName.toLowerCase().includes(q) ||
        t.customerPhone.includes(q) ||
        t.bookingRef.toLowerCase().includes(q) ||
        t.pickupLocation.toLowerCase().includes(q) ||
        t.dropoffLocation.toLowerCase().includes(q) ||
        t.vehicleCategory.toLowerCase().includes(q) ||
        (t.assignedVehiclePlate && t.assignedVehiclePlate.toLowerCase().includes(q)) ||
        (t.assignedDriverName && t.assignedDriverName.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const filteredDrivers = drivers.filter((d) => {
    if (driverStatusFilter !== 'ALL' && d.status.toUpperCase() !== driverStatusFilter) {
      return false;
    }
    if (driverSearch.trim()) {
      const q = driverSearch.toLowerCase();
      return (
        d.fullName.toLowerCase().includes(q) ||
        d.phoneNumber.includes(q) ||
        (d.whatsappNumber && d.whatsappNumber.includes(q)) ||
        (d.email && d.email.toLowerCase().includes(q)) ||
        d.citizenshipOrIdNo.toLowerCase().includes(q) ||
        d.licenseDocId.toLowerCase().includes(q)
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
            onPress={() => {
              hapticFeedback.light();
              setIsNotificationsModalOpen(true);
            }}
            style={({ pressed }) => [
              styles.logoutBtn,
              { backgroundColor: colors.accentSoft },
              pressed && styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Open Admin Notifications Desk"
          >
            <Bell size={16} color={colors.accent} />
          </Pressable>
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
        style={styles.mainScrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.accent}
          />
        }
      >
        {/* ================= TAB 1: DISPATCH DESK ================= */}
        {activeTab === 'trips' && (
          <View>
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

            <View style={styles.sectionContainer}>
              {/* Trip Search Input */}
              <View style={styles.searchBar}>
                <Search size={18} color={colors.subtle} style={{ marginRight: spacing.sm }} />
                <TextInput
                  style={styles.searchInput}
                  value={tripSearch}
                  onChangeText={setTripSearch}
                  placeholder="Search reservations by customer, phone, ref, route..."
                  placeholderTextColor={colors.muted}
                  accessibilityLabel="Search reservations"
                />
                {tripSearch ? (
                  <Pressable onPress={() => setTripSearch('')} accessibilityLabel="Clear reservation search">
                    <X size={18} color={colors.subtle} />
                  </Pressable>
                ) : null}
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
                <Pressable
                  key={trip.id}
                  onPress={() => openTripInspection(trip)}
                  style={({ pressed }) => [styles.tripCard, pressed && styles.pressed]}
                  accessibilityRole="button"
                  accessibilityLabel={`Inspect and dispatch ${trip.bookingRef}`}
                >
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
                      <Text style={styles.fareHighlight}>{trip.finalFare || trip.estimatedFare}</Text>
                    </View>
                  </View>

                  {/* Customer Notes Preview */}
                  {trip.additionalDetails ? (
                    <View style={styles.tripCardNotePreview}>
                      <Text style={styles.tripCardNotePreviewText} numberOfLines={1}>
                        💬 {trip.additionalDetails}
                      </Text>
                    </View>
                  ) : null}

                  {/* Assigned Vehicle & Driver Display if Confirmed */}
                  {trip.status === 'Confirmed' && trip.assignedVehiclePlate && (
                    <View style={styles.assignedVehicleBanner}>
                      <Car size={14} color={colors.success} />
                      <Text style={styles.assignedVehicleText}>
                        Dispatched: <Text style={{ fontWeight: '800' }}>{trip.assignedVehicleModel}</Text> ({trip.assignedVehiclePlate})
                        {trip.assignedDriverName ? ` • Driver: ${trip.assignedDriverName}` : ''}
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

                  {/* Action Buttons for Pending trips: Reject or Inspect & Dispatch */}
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
                        onPress={() => openTripInspection(trip)}
                        style={({ pressed }) => [styles.approveBtn, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel="Inspect and dispatch"
                      >
                        <Car size={14} color={colors.onAccent} style={{ marginRight: 6 }} />
                        <Text style={styles.approveBtnText}>Inspect & Dispatch</Text>
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

                  {/* Card Tap Prompt */}
                  <View style={styles.cardTapPrompt}>
                    <Eye size={12} color={colors.accent} />
                    <Text style={styles.cardTapPromptText}>Tap card to inspect & copy WhatsApp message</Text>
                    <ChevronRight size={12} color={colors.subtle} />
                  </View>
                </Pressable>
              ))
            )}
          </View>
        </View>
      )}

        {/* ================= TAB 2: DRIVERS DIRECTORY ================= */}
        {(activeTab === 'drivers' || activeTab === 'fleet') && (
          <View style={styles.sectionContainer}>
            {/* Search Input for Drivers */}
            <View style={styles.searchBar}>
              <Search size={18} color={colors.subtle} style={{ marginRight: spacing.sm }} />
              <TextInput
                style={styles.searchInput}
                value={driverSearch}
                onChangeText={setDriverSearch}
                placeholder="Search drivers by name, phone, license..."
                placeholderTextColor={colors.muted}
              />
              {driverSearch ? (
                <Pressable onPress={() => setDriverSearch('')}>
                  <X size={18} color={colors.subtle} />
                </Pressable>
              ) : null}
            </View>

            {/* Status Filter Chips */}
            <View style={styles.categoryFilterRow}>
              {(['ALL', 'ACTIVE', 'PENDING', 'INACTIVE'] as const).map((st) => (
                <Pressable
                  key={st}
                  onPress={() => {
                    hapticFeedback.selection();
                    setDriverStatusFilter(st);
                  }}
                  style={[
                    styles.catFilterChip,
                    driverStatusFilter === st && styles.catFilterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catFilterChipText,
                      driverStatusFilter === st && styles.catFilterChipTextActive,
                    ]}
                  >
                    {st}
                  </Text>
                </Pressable>
              ))}
            </View>

            {/* Drivers Controls Header */}
            <View style={styles.fleetHeaderRow}>
              <View>
                <Text style={styles.driverSectionCountText}>
                  {filteredDrivers.length} {filteredDrivers.length === 1 ? 'Driver' : 'Drivers'} Listed
                </Text>
              </View>

              <Pressable
                onPress={() => {
                  hapticFeedback.selection();
                  setIsAddDriverOpen(true);
                }}
                style={({ pressed }) => [styles.addVehicleBtn, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Add new driver"
              >
                <Plus size={16} color={colors.onAccent} />
                <Text style={styles.addVehicleBtnText}>Add Driver</Text>
              </Pressable>
            </View>

            {/* Driver Cards */}
            {filteredDrivers.length === 0 ? (
              <View style={styles.emptyState}>
                <UserCheck size={36} color={colors.subtle} />
                <Text style={styles.emptyStateTitle}>No drivers found</Text>
                <Text style={styles.emptyStateDesc}>Tap &quot;+ Add Driver&quot; to register drivers into dka_owners &amp; cr_owners.</Text>
              </View>
            ) : (
              filteredDrivers.map((driver) => (
                <View key={driver.id} style={styles.driverCard}>
                  {/* Top Row: Avatar, Name, Status */}
                  <View style={styles.driverCardTop}>
                    <View style={styles.driverAvatarCircle}>
                      <Text style={styles.driverAvatarLetter}>
                        {driver.fullName.charAt(0).toUpperCase()}
                      </Text>
                    </View>

                    <View style={styles.driverDetails}>
                      <Text style={styles.driverName}>{driver.fullName}</Text>
                      <View style={styles.driverSubRow}>
                        <Text style={styles.driverOwnerRef}>ID #{driver.ownerId}</Text>
                      </View>
                    </View>

                    <View
                      style={[
                        styles.fleetStatusTag,
                        driver.status === 'active' && styles.fleetStatusAvailable,
                        driver.status === 'pending' && styles.fleetStatusAssigned,
                        driver.status === 'inactive' && styles.fleetStatusMaintenance,
                      ]}
                    >
                      <View
                        style={[
                          styles.fleetStatusDot,
                          driver.status === 'active' && { backgroundColor: colors.success },
                          driver.status === 'pending' && { backgroundColor: colors.highlight },
                          driver.status === 'inactive' && { backgroundColor: colors.error },
                        ]}
                      />
                      <Text style={styles.fleetStatusText}>{driver.status.toUpperCase()}</Text>
                    </View>
                  </View>

                  {/* Contact Badges Row */}
                  <View style={styles.driverContactRow}>
                    <Pressable
                      onPress={() => Linking.openURL(`tel:${driver.phoneNumber}`)}
                      style={({ pressed }) => [styles.driverContactChip, pressed && styles.pressed]}
                      accessibilityRole="button"
                      accessibilityLabel={`Call ${driver.fullName}`}
                    >
                      <Phone size={12} color={colors.accent} />
                      <Text style={styles.driverContactChipText}>{driver.phoneNumber}</Text>
                    </Pressable>

                    {driver.whatsappNumber ? (
                      <Pressable
                        onPress={() =>
                          Linking.openURL(
                            `https://wa.me/${driver.whatsappNumber?.replace(/\D/g, '')}`,
                          )
                        }
                        style={({ pressed }) => [styles.driverWhatsAppChip, pressed && styles.pressed]}
                        accessibilityRole="button"
                        accessibilityLabel={`WhatsApp ${driver.fullName}`}
                      >
                        <ExternalLink size={12} color={colors.success} />
                        <Text style={styles.driverWhatsAppChipText}>WhatsApp</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  {/* Credentials / IDs Row */}
                  <View style={styles.driverCredsRow}>
                    <View style={styles.driverCredBadge}>
                      <Text style={styles.driverCredLabel}>CITIZENSHIP:</Text>
                      <Text style={styles.driverCredValue}>{driver.citizenshipOrIdNo}</Text>
                    </View>
                    <View style={styles.driverCredBadge}>
                      <Text style={styles.driverCredLabel}>LICENSE:</Text>
                      <Text style={styles.driverCredValue}>{driver.licenseDocId}</Text>
                    </View>
                  </View>

                  {/* Attached Vehicle (dka_vehicles / cr_vehicles) */}
                  {driver.vehicle ? (
                    <View style={styles.driverVehicleBadge}>
                      <Car size={14} color={colors.accent} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.driverVehicleTitle}>
                          {driver.vehicle.makeModel} ({driver.vehicle.licensePlate})
                        </Text>
                        <Text style={styles.driverVehicleSub}>
                          {driver.vehicle.category || 'SUV'} • {driver.vehicle.seatingCapacity} Seats • {driver.vehicle.color || 'White'}
                        </Text>
                      </View>
                    </View>
                  ) : null}

                  {/* Email & Status Toggle Row */}
                  <View style={styles.driverFooterRow}>
                    {driver.email ? (
                      <Text style={styles.driverEmailText} numberOfLines={1}>
                        {driver.email}
                      </Text>
                    ) : (
                      <View style={{ flex: 1 }} />
                    )}

                    <Pressable
                      onPress={() => handleToggleDriverStatus(driver)}
                      style={({ pressed }) => [
                        styles.driverStatusToggleBtn,
                        driver.status === 'inactive' && styles.driverStatusToggleBtnActive,
                        pressed && styles.pressed,
                      ]}
                    >
                      <UserCheck
                        size={13}
                        color={driver.status === 'inactive' ? colors.success : colors.subtle}
                      />
                      <Text
                        style={[
                          styles.driverStatusToggleText,
                          driver.status === 'inactive' && { color: colors.success },
                        ]}
                      >
                        {driver.status === 'active' ? 'Set as Inactive' : 'Activate Driver'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))
            )}
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

        {/* ================= TAB 4: PROFILE ================= */}
        {activeTab === 'profile' && (
          <View style={styles.sectionContainer}>
            {/* Operator Identity Card */}
            <View style={styles.profileCard}>
              <View style={styles.profileHeaderRow}>
                <View style={[styles.profileAvatarCircle, { backgroundColor: colors.accentSoft }]}>
                  <ShieldCheck size={32} color={colors.accent} strokeWidth={2.2} />
                </View>
                <View style={styles.profileIdentityCol}>
                  <Text style={styles.profileName}>{adminUser?.name || 'Drive Kendra Admin'}</Text>
                  <Text style={styles.profilePhone}>{adminUser?.phone || '+977 980-0000000'}</Text>
                  <View style={styles.profileRoleBadge}>
                    <View style={styles.profileRoleDot} />
                    <Text style={styles.profileRoleText}>SYSTEM ADMINISTRATOR</Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Quick Operational Metrics */}
            <View style={styles.profileStatsCard}>
              <Text style={styles.profileSectionTitle}>System Operations Overview</Text>
              <View style={styles.profileStatsGrid}>
                <View style={styles.profileStatBox}>
                  <Text style={styles.profileStatValue}>{effectiveStats.pendingRequests ?? 0}</Text>
                  <Text style={styles.profileStatLabel}>Pending Trips</Text>
                </View>
                <View style={styles.profileStatBox}>
                  <Text style={styles.profileStatValue}>{effectiveStats.activeFleet ?? 0}</Text>
                  <Text style={styles.profileStatLabel}>Active Fleet</Text>
                </View>
                <View style={styles.profileStatBox}>
                  <Text style={styles.profileStatValue}>{effectiveStats.totalUsers ?? 0}</Text>
                  <Text style={styles.profileStatLabel}>Customers</Text>
                </View>
                <View style={styles.profileStatBox}>
                  <Text style={[styles.profileStatValue, { fontSize: 13 }]}>
                    {effectiveStats.totalRevenue ?? 'NPR 0'}
                  </Text>
                  <Text style={styles.profileStatLabel}>Total Volume</Text>
                </View>
              </View>
            </View>

            {/* System Security & Architecture */}
            <View style={styles.securityCard}>
              <Text style={styles.profileSectionTitle}>Security & Access Infrastructure</Text>
              <View style={styles.securityRow}>
                <View style={styles.securityIconWrap}>
                  <Lock size={16} color={colors.accent} />
                </View>
                <View style={styles.securityTextCol}>
                  <Text style={styles.securityTitle}>PostgreSQL Row Level Security (RLS)</Text>
                  <Text style={styles.securitySubtitle}>
                    Active session parameter (SET LOCAL app.is_admin = &apos;true&apos;)
                  </Text>
                </View>
                <View style={styles.securityActiveBadge}>
                  <View style={styles.rlsDot} />
                  <Text style={styles.securityActiveText}>ACTIVE</Text>
                </View>
              </View>

              <View style={styles.securityRow}>
                <View style={styles.securityIconWrap}>
                  <Shield size={16} color={colors.accent} />
                </View>
                <View style={styles.securityTextCol}>
                  <Text style={styles.securityTitle}>Two-Factor PIN Gate</Text>
                  <Text style={styles.securitySubtitle}>
                    4-Digit hardware biometric / cryptographic challenge
                  </Text>
                </View>
                <View style={styles.securityActiveBadge}>
                  <View style={styles.rlsDot} />
                  <Text style={styles.securityActiveText}>ENFORCED</Text>
                </View>
              </View>
            </View>

            {/* Appearance / Theme Mode Selector */}
            <View style={styles.themeSectionCard}>
              <Text style={styles.profileSectionTitle}>Display Theme</Text>
              <Text style={styles.profileSectionSubtitle}>
                Select interface appearance for low-light or daytime mountain operations
              </Text>
              <ThemeModeSelector style={{ marginTop: spacing.sm }} />
            </View>

            {/* Session Exit & Sign Out */}
            <Pressable
              onPress={handleSignOut}
              style={({ pressed }) => [styles.profileSignOutBtn, pressed && styles.pressed]}
              accessibilityRole="button"
              accessibilityLabel="Sign out of Admin Portal"
            >
              <LogOut size={18} color={colors.error} />
              <Text style={styles.profileSignOutText}>Lock & Sign Out Admin Portal</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* ================= BOTTOM TAB NAVIGATION BAR ================= */}
      <View
        style={[
          styles.bottomTabBar,
          {
            height: 58 + Math.max(insets.bottom, 10),
            paddingBottom: Math.max(insets.bottom, 10),
          },
        ]}
      >
        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('trips');
          }}
          style={styles.tabBarItem}
          accessibilityRole="tab"
          accessibilityLabel="Dispatch Desk"
          accessibilityState={{ selected: activeTab === 'trips' }}
        >
          <View style={styles.tabIconWrap}>
            <CalendarCheck
              size={20}
              color={activeTab === 'trips' ? colors.accent : colors.subtle}
              strokeWidth={activeTab === 'trips' ? 2.4 : 2}
            />
            {effectiveStats.pendingRequests > 0 && (
              <View style={styles.tabBadge}>
                <Text style={styles.tabBadgeText}>
                  {effectiveStats.pendingRequests > 9 ? '9+' : effectiveStats.pendingRequests}
                </Text>
              </View>
            )}
          </View>
          <Text
            style={[
              styles.tabBarLabel,
              activeTab === 'trips' && styles.tabBarLabelActive,
            ]}
            numberOfLines={1}
          >
            Dispatch Desk
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('drivers');
          }}
          style={styles.tabBarItem}
          accessibilityRole="tab"
          accessibilityLabel="Drivers Directory"
          accessibilityState={{ selected: activeTab === 'drivers' || activeTab === 'fleet' }}
        >
          <View style={styles.tabIconWrap}>
            <UserCheck
              size={20}
              color={activeTab === 'drivers' || activeTab === 'fleet' ? colors.accent : colors.subtle}
              strokeWidth={activeTab === 'drivers' || activeTab === 'fleet' ? 2.4 : 2}
            />
          </View>
          <Text
            style={[
              styles.tabBarLabel,
              (activeTab === 'drivers' || activeTab === 'fleet') && styles.tabBarLabelActive,
            ]}
            numberOfLines={1}
          >
            Drivers
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('users');
          }}
          style={styles.tabBarItem}
          accessibilityRole="tab"
          accessibilityLabel="Users Directory"
          accessibilityState={{ selected: activeTab === 'users' }}
        >
          <View style={styles.tabIconWrap}>
            <Users
              size={20}
              color={activeTab === 'users' ? colors.accent : colors.subtle}
              strokeWidth={activeTab === 'users' ? 2.4 : 2}
            />
          </View>
          <Text
            style={[
              styles.tabBarLabel,
              activeTab === 'users' && styles.tabBarLabelActive,
            ]}
            numberOfLines={1}
          >
            Users Directory
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            hapticFeedback.selection();
            setActiveTab('profile');
          }}
          style={styles.tabBarItem}
          accessibilityRole="tab"
          accessibilityLabel="Profile"
          accessibilityState={{ selected: activeTab === 'profile' }}
        >
          <View style={styles.tabIconWrap}>
            <User
              size={20}
              color={activeTab === 'profile' ? colors.accent : colors.subtle}
              strokeWidth={activeTab === 'profile' ? 2.4 : 2}
            />
          </View>
          <Text
            style={[
              styles.tabBarLabel,
              activeTab === 'profile' && styles.tabBarLabelActive,
            ]}
            numberOfLines={1}
          >
            Profile
          </Text>
        </Pressable>
      </View>

      {/* ================= MODAL: TRIP INSPECTION, WHATSAPP DISPATCH & ASSIGNMENT ================= */}
      <Modal
        visible={!!inspectedTrip}
        transparent
        animationType="slide"
        onRequestClose={() => setInspectedTrip(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '90%' }]}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                  <Text style={styles.modalTitle}>Trip Reservation</Text>
                  <View style={styles.tripRefBadge}>
                    <Text style={styles.tripRefText}>{inspectedTrip?.bookingRef}</Text>
                  </View>
                </View>
                <Text style={styles.modalSubtitle}>
                  Status: {inspectedTrip?.status} • {inspectedTrip?.tripType}
                </Text>
              </View>
              <Pressable
                onPress={() => setInspectedTrip(null)}
                style={styles.modalCloseBtn}
                accessibilityLabel="Close modal"
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: spacing.xl }}>
              {/* 1. Customer Section */}
              <View style={styles.inspectSection}>
                <Text style={styles.inspectSectionLabel}>CUSTOMER DETAILS</Text>
                <View style={styles.inspectCustomerCard}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.inspectCustomerName}>{inspectedTrip?.customerName}</Text>
                    <Text style={styles.inspectCustomerEmail}>{inspectedTrip?.customerEmail}</Text>
                  </View>
                  <View style={styles.inspectCustomerActions}>
                    <Pressable
                      onPress={() => inspectedTrip && Linking.openURL(`tel:${inspectedTrip.customerPhone}`)}
                      style={({ pressed }) => [styles.inspectActionBtn, pressed && styles.pressed]}
                      accessibilityLabel={`Call ${inspectedTrip?.customerName}`}
                    >
                      <Phone size={14} color={colors.accent} />
                      <Text style={styles.inspectActionBtnText}>Call</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => inspectedTrip && Linking.openURL(`https://wa.me/${inspectedTrip.customerPhone.replace(/\D/g, '')}`)}
                      style={({ pressed }) => [styles.inspectActionBtnWhatsApp, pressed && styles.pressed]}
                      accessibilityLabel={`WhatsApp ${inspectedTrip?.customerName}`}
                    >
                      <MessageCircle size={14} color={colors.whatsapp} />
                      <Text style={styles.inspectActionBtnWhatsAppText}>WhatsApp</Text>
                    </Pressable>
                  </View>
                </View>
              </View>

              {/* 2. Route & Expedition Details */}
              <View style={styles.inspectSection}>
                <Text style={styles.inspectSectionLabel}>EXPEDITION & ROUTE DETAILS</Text>
                <View style={styles.inspectDetailBox}>
                  <View style={styles.routeTimeline}>
                    <View style={styles.routeVisualCol}>
                      <View style={styles.routeOriginDot} />
                      <View style={styles.routeConnectorLine} />
                      <View style={styles.routeDestDot} />
                    </View>
                    <View style={styles.routeLabelsCol}>
                      <View style={styles.routeStop}>
                        <Text style={styles.routeStopType}>PICKUP LOCATION</Text>
                        <Text style={styles.routeLocationName}>{inspectedTrip?.pickupLocation}</Text>
                      </View>
                      <View style={styles.routeStopDest}>
                        <Text style={styles.routeStopTypeDest}>DROPOFF LOCATION</Text>
                        <Text style={styles.routeLocationName}>{inspectedTrip?.dropoffLocation}</Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.inspectGrid}>
                    <View style={styles.inspectGridItem}>
                      <Calendar size={13} color={colors.subtle} />
                      <Text style={styles.inspectGridLabel}>Date & Time:</Text>
                      <Text style={styles.inspectGridVal}>
                        {inspectedTrip?.pickupDate ? new Date(inspectedTrip.pickupDate).toLocaleDateString() : ''} • {inspectedTrip?.pickupTime}
                      </Text>
                    </View>
                    <View style={styles.inspectGridItem}>
                      <Users size={13} color={colors.subtle} />
                      <Text style={styles.inspectGridLabel}>Passengers:</Text>
                      <Text style={styles.inspectGridVal}>{inspectedTrip?.passengerCount} Pax</Text>
                    </View>
                    <View style={styles.inspectGridItem}>
                      <Car size={13} color={colors.subtle} />
                      <Text style={styles.inspectGridLabel}>Vehicle Category:</Text>
                      <Text style={styles.inspectGridVal}>{inspectedTrip?.vehicleCategory}</Text>
                    </View>
                    <View style={styles.inspectGridItem}>
                      <Tag size={13} color={colors.subtle} />
                      <Text style={styles.inspectGridLabel}>Target Budget:</Text>
                      <Text style={styles.inspectGridVal}>{inspectedTrip?.estimatedFare}</Text>
                    </View>
                  </View>

                  {inspectedTrip?.additionalDetails ? (
                    <View style={styles.inspectNotesWrap}>
                      <Text style={styles.inspectNotesLabel}>Customer Instructions / Notes:</Text>
                      <Text style={styles.inspectNotesText}>{inspectedTrip.additionalDetails}</Text>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* 3. WhatsApp Dispatch Briefing Preview & Copy */}
              <View style={styles.inspectSection}>
                <View style={styles.whatsappHeaderRow}>
                  <Text style={styles.inspectSectionLabel}>WHATSAPP DISPATCH MESSAGE</Text>
                  {copiedWhatsAppToast && (
                    <View style={styles.copiedToast}>
                      <Check size={12} color={colors.success} />
                      <Text style={styles.copiedToastText}>Copied to Clipboard!</Text>
                    </View>
                  )}
                </View>

                <View style={styles.whatsappTerminal}>
                  <Text style={styles.whatsappTerminalText}>
                    {inspectedTrip
                      ? formatWhatsAppDispatchMessage(
                          inspectedTrip,
                          resolvedTargetVehicle,
                          selectedDriver,
                          dispatchPrice,
                        )
                      : ''}
                  </Text>
                </View>

                <View style={styles.whatsappButtonsRow}>
                  <Pressable
                    onPress={handleCopyWhatsApp}
                    style={({ pressed }) => [styles.copyWaBtn, pressed && styles.pressed]}
                    accessibilityLabel="Copy WhatsApp Message"
                  >
                    <Copy size={15} color={colors.onAccent} />
                    <Text style={styles.copyWaBtnText}>Copy WhatsApp Message</Text>
                  </Pressable>

                  <Pressable
                    onPress={handleOpenWhatsApp}
                    style={({ pressed }) => [styles.openWaBtn, pressed && styles.pressed]}
                    accessibilityLabel="Open in WhatsApp"
                  >
                    <MessageCircle size={15} color={colors.whatsapp} />
                    <Text style={styles.openWaBtnText}>WhatsApp</Text>
                  </Pressable>
                </View>
              </View>

              {/* 4. Dispatch Form (if Pending) */}
              {inspectedTrip?.status === 'Pending' ? (
                <View style={styles.inspectSection}>
                  <Text style={styles.inspectSectionLabel}>DISPATCH CONTROLS & ASSIGNMENT</Text>

                  {/* Step 1: Select Driver (Driver's registered vehicle is shown) */}
                  <View style={styles.dispatchStepHeaderRow}>
                    <Text style={styles.dispatchStepLabel}>1. Attach Active Driver *</Text>
                    <Text style={styles.dispatchStepHint}>Driver's vehicle details shown below</Text>
                  </View>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.sm }}>
                    {drivers
                      .filter((d) => d.status === 'active' || (d.id || d.ownerId) === dispatchDriverId)
                      .map((drv) => {
                        const drvId = drv.id || drv.ownerId;
                        const isSelected = dispatchDriverId === drvId;
                        const drvVeh = getDriverVehicle(drv);
                        return (
                          <Pressable
                            key={drvId}
                            onPress={() => handleSelectDriver(drv)}
                            style={[styles.selectorChip, isSelected && styles.selectorChipActive]}
                            accessibilityRole="button"
                            accessibilityLabel={`Select driver ${drv.fullName}`}
                          >
                            <User size={16} color={isSelected ? colors.accent : colors.subtle} />
                            <View style={{ marginLeft: 8 }}>
                              <Text style={[styles.selectorChipTitle, isSelected && styles.selectorChipTitleActive]}>
                                {drv.fullName}
                              </Text>
                              <Text style={styles.selectorChipSub}>{drv.phoneNumber}</Text>
                              {drvVeh ? (
                                <View style={styles.chipVehicleRow}>
                                  <Car size={11} color={isSelected ? colors.accent : colors.muted} />
                                  <Text
                                    style={[styles.chipVehicleText, isSelected && styles.chipVehicleTextActive]}
                                    numberOfLines={1}
                                  >
                                    {drvVeh.model} ({drvVeh.plate})
                                  </Text>
                                </View>
                              ) : (
                                <Text style={styles.chipNoVehicleText}>No vehicle linked</Text>
                              )}
                            </View>
                            {isSelected && <Check size={14} color={colors.accent} style={{ marginLeft: 6 }} />}
                          </Pressable>
                        );
                      })}
                  </ScrollView>

                  {/* Driver's Vehicle Detail Banner */}
                  {selectedDriver && (
                    <View style={styles.autoVehicleBanner}>
                      <View style={styles.autoVehicleIconWrap}>
                        <Car size={16} color={colors.accent} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={styles.autoVehicleTitle}>VEHICLE DETAILS</Text>
                          <View style={styles.driverOwnerBadge}>
                            <Text style={styles.driverOwnerBadgeText}>Driver's Vehicle</Text>
                          </View>
                        </View>
                        {selectedDriverVehicle ? (
                          <>
                            <Text style={styles.autoVehicleModel}>
                              {selectedDriverVehicle.model}
                            </Text>
                            <Text style={styles.autoVehicleSub}>
                              Plate: {selectedDriverVehicle.plate} • {selectedDriverVehicle.category || 'Fleet'} ({selectedDriverVehicle.seats || 4} Seats)
                            </Text>
                          </>
                        ) : (
                            <Text style={styles.autoVehicleWarning}>
                              ⚠️ This driver has no vehicle registered yet.
                            </Text>
                        )}
                      </View>
                      {selectedDriverVehicle && (
                        <View style={styles.linkedPill}>
                          <Check size={12} color={colors.success} />
                          <Text style={styles.linkedPillText}>Attached</Text>
                        </View>
                      )}
                    </View>
                  )}

                  {/* Step 2: Agreed Price */}
                  <Text style={[styles.dispatchStepLabel, { marginTop: spacing.sm }]}>2. Final Confirmed Fare (NPR)</Text>
                  <TextInput
                    style={styles.priceInput}
                    value={dispatchPrice}
                    onChangeText={setDispatchPrice}
                    placeholder="e.g. NPR 14,000"
                    placeholderTextColor={colors.subtle}
                  />

                  {/* Submit Dispatch */}
                  <Pressable
                    disabled={isSubmittingDispatch}
                    onPress={handleConfirmDispatch}
                    style={({ pressed }) => [styles.confirmDispatchBtn, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Confirm and dispatch to user"
                  >
                    {isSubmittingDispatch ? (
                      <ActivityIndicator color={colors.onAccent} />
                    ) : (
                      <>
                        <CheckCircle2 size={18} color={colors.onAccent} style={{ marginRight: 8 }} />
                        <Text style={styles.confirmDispatchBtnText}>Confirm & Dispatch to User</Text>
                      </>
                    )}
                  </Pressable>
                </View>
              ) : (
                <View style={styles.inspectSection}>
                  <Text style={styles.inspectSectionLabel}>ASSIGNED DETAILS</Text>
                  <View style={styles.inspectDetailBox}>
                    <Text style={styles.assignedVehicleText}>
                      Vehicle: <Text style={{ fontWeight: '800' }}>{inspectedTrip?.assignedVehicleModel}</Text> ({inspectedTrip?.assignedVehiclePlate || 'TBD'})
                    </Text>
                    {inspectedTrip?.assignedDriverName ? (
                      <Text style={[styles.assignedVehicleText, { marginTop: 4 }]}>
                        Driver: <Text style={{ fontWeight: '800' }}>{inspectedTrip.assignedDriverName}</Text> ({inspectedTrip.assignedDriverPhone || ''})
                      </Text>
                    ) : null}
                    <Text style={[styles.assignedVehicleText, { marginTop: 4 }]}>
                      Confirmed Fare: <Text style={{ fontWeight: '800', color: colors.accent }}>{inspectedTrip?.finalFare || inspectedTrip?.estimatedFare}</Text>
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>
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

      {/* ================= MODAL: REGISTER DRIVER ================= */}
      <Modal
        visible={isAddDriverOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAddDriverOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.sheetHandle} />
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Register Driver &amp; Vehicle</Text>
                <Text style={styles.modalSubtitle}>
                  Register driver (dka_owners) &amp; attached vehicle (dka_vehicles) in one place.
                </Text>
              </View>
              <Pressable
                onPress={() => setIsAddDriverOpen(false)}
                style={styles.modalCloseBtn}
              >
                <X size={20} color={colors.text} />
              </Pressable>
            </View>

            <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
              {/* SECTION 1: DRIVER PROFILE */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: spacing.sm }}>
                <User size={15} color={colors.accent} />
                <Text style={{ fontSize: 11, fontWeight: '800', color: colors.accent, letterSpacing: 0.8 }}>
                  1. DRIVER PROFILE (dka_owners &amp; cr_owners)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Full Legal Name *</Text>
                <TextInput
                  style={styles.formInput}
                  value={newDriver.fullName}
                  onChangeText={(val) => setNewDriver({ ...newDriver, fullName: val })}
                  placeholder="e.g., Pasang Dorje Sherpa"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>Phone Number *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newDriver.phoneNumber}
                    onChangeText={(val) => setNewDriver({ ...newDriver, phoneNumber: val })}
                    placeholder="e.g., +977 9851011223"
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>WhatsApp Number</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newDriver.whatsappNumber || ''}
                    onChangeText={(val) => setNewDriver({ ...newDriver, whatsappNumber: val })}
                    placeholder="e.g., +977 9851011223"
                    placeholderTextColor={colors.muted}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email Address (Optional)</Text>
                <TextInput
                  style={styles.formInput}
                  value={newDriver.email || ''}
                  onChangeText={(val) => setNewDriver({ ...newDriver, email: val })}
                  placeholder="e.g., driver@drivekendra.com"
                  placeholderTextColor={colors.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>Citizenship / ID No *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newDriver.citizenshipOrIdNo}
                    onChangeText={(val) =>
                      setNewDriver({ ...newDriver, citizenshipOrIdNo: val })
                    }
                    placeholder="e.g., 27-01-72-04512"
                    placeholderTextColor={colors.muted}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Driver License No *</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newDriver.licenseDocId}
                    onChangeText={(val) =>
                      setNewDriver({ ...newDriver, licenseDocId: val })
                    }
                    placeholder="e.g., LIC-EXP-9921"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Initial Status</Text>
                <View style={styles.categoryPickerRow}>
                  {(['active', 'pending'] as const).map((st) => (
                    <Pressable
                      key={st}
                      onPress={() => setNewDriver({ ...newDriver, status: st })}
                      style={[
                        styles.catOption,
                        newDriver.status === st && styles.catOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          newDriver.status === st && styles.catOptionTextActive,
                        ]}
                      >
                        {st.toUpperCase()}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>

              {/* SECTION 2: ASSIGNED VEHICLE DETAILS */}
              <View style={styles.modalSectionDivider}>
                <Car size={16} color={colors.accent} />
                <Text style={styles.modalSectionDividerTitle}>
                  2. ASSIGNED VEHICLE (dka_vehicles &amp; cr_vehicles)
                </Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vehicle Make &amp; Model</Text>
                <TextInput
                  style={styles.formInput}
                  value={newDriver.makeModel || ''}
                  onChangeText={(val) => setNewDriver({ ...newDriver, makeModel: val })}
                  placeholder="e.g., Mahindra Scorpio S11 4x4 / Toyota HiAce"
                  placeholderTextColor={colors.muted}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: spacing.sm }]}>
                  <Text style={styles.formLabel}>License Plate No</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newDriver.licensePlate || ''}
                    onChangeText={(val) => setNewDriver({ ...newDriver, licensePlate: val })}
                    placeholder="e.g., BA 2 PA 4521"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Vehicle Color</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newDriver.color || ''}
                    onChangeText={(val) => setNewDriver({ ...newDriver, color: val })}
                    placeholder="e.g., White / Silver / Black"
                    placeholderTextColor={colors.muted}
                  />
                </View>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Vehicle Category</Text>
                <View style={styles.categoryPickerRow}>
                  {(['SUV', 'Sedan', 'HiAce', 'Bus'] as const).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => {
                        const typeId = cat === 'Sedan' ? 1 : cat === 'HiAce' ? 3 : cat === 'Bus' ? 4 : 2;
                        const defaultSeats = cat === 'Sedan' ? 4 : cat === 'HiAce' ? 14 : cat === 'Bus' ? 28 : 7;
                        setNewDriver({
                          ...newDriver,
                          category: cat,
                          vehicleTypeId: typeId,
                          seatingCapacity: defaultSeats,
                        });
                      }}
                      style={[
                        styles.catOption,
                        newDriver.category === cat && styles.catOptionActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.catOptionText,
                          newDriver.category === cat && styles.catOptionTextActive,
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
                  <Text style={styles.formLabel}>Seating Capacity</Text>
                  <TextInput
                    style={styles.formInput}
                    value={String(newDriver.seatingCapacity || 7)}
                    onChangeText={(val) =>
                      setNewDriver({ ...newDriver, seatingCapacity: parseInt(val, 10) || 7 })
                    }
                    placeholder="e.g., 7"
                    placeholderTextColor={colors.muted}
                    keyboardType="number-pad"
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1 }]}>
                  <Text style={styles.formLabel}>Bluebook Document ID</Text>
                  <TextInput
                    style={styles.formInput}
                    value={newDriver.bluebookDocId || ''}
                    onChangeText={(val) => setNewDriver({ ...newDriver, bluebookDocId: val })}
                    placeholder="e.g., DOC-BB-9921"
                    placeholderTextColor={colors.muted}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </ScrollView>

            <Pressable
              disabled={isSubmittingDriver}
              onPress={handleCreateDriver}
              style={[styles.createVehicleSubmitBtn, isSubmittingDriver && { opacity: 0.7 }]}
            >
              {isSubmittingDriver ? (
                <ActivityIndicator color={colors.onAccent} />
              ) : (
                <Text style={styles.createVehicleSubmitText}>Register Driver &amp; Vehicle</Text>
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

      {/* Admin Notifications Desk Modal */}
      <AdminNotificationsModal
        visible={isNotificationsModalOpen}
        onClose={() => setIsNotificationsModalOpen(false)}
      />
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
    mainScrollView: {
      flex: 1,
    },
    bottomTabBar: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 6,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
      elevation: 8,
    },
    tabBarItem: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 2,
    },
    tabIconWrap: {
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
      width: 28,
      height: 24,
    },
    tabBadge: {
      position: 'absolute',
      top: -4,
      right: -8,
      backgroundColor: colors.accent,
      borderRadius: 8,
      minWidth: 16,
      height: 16,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 3,
    },
    tabBadgeText: {
      color: colors.onAccent,
      fontSize: 9,
      fontWeight: '800',
    },
    tabBarLabel: {
      fontSize: 10,
      fontWeight: '600',
      color: colors.subtle,
      marginTop: 2,
      paddingBottom: 2,
      textAlign: 'center',
    },
    tabBarLabelActive: {
      color: colors.accent,
      fontWeight: '800',
    },
    profileCard: {
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
    profileHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    profileAvatarCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      alignItems: 'center',
      justifyContent: 'center',
    },
    profileIdentityCol: {
      flex: 1,
      gap: 2,
    },
    profileName: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
    },
    profilePhone: {
      fontSize: 13,
      color: colors.subtle,
      fontWeight: '500',
    },
    profileRoleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      alignSelf: 'flex-start',
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
      marginTop: 4,
    },
    profileRoleDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    profileRoleText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.5,
    },
    profileStatsCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileSectionTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.text,
      marginBottom: spacing.xs,
    },
    profileSectionSubtitle: {
      fontSize: 11,
      color: colors.subtle,
      marginBottom: spacing.sm,
    },
    profileStatsGrid: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    profileStatBox: {
      flex: 1,
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.sm,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileStatValue: {
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
    },
    profileStatLabel: {
      fontSize: 10,
      color: colors.subtle,
      marginTop: 2,
      fontWeight: '600',
      textAlign: 'center',
    },
    securityCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.md,
    },
    securityRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    securityIconWrap: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    securityTextCol: {
      flex: 1,
    },
    securityTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    securitySubtitle: {
      fontSize: 10,
      color: colors.subtle,
      marginTop: 1,
    },
    securityActiveBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.successSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.pill,
    },
    securityActiveText: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.success,
      letterSpacing: 0.5,
    },
    themeSectionCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    profileSignOutBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: colors.errorSoft,
      borderRadius: radius.lg,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.error,
      marginTop: spacing.sm,
      marginBottom: spacing.xl,
    },
    profileSignOutText: {
      fontSize: 13,
      fontWeight: '800',
      color: colors.error,
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
    driverSectionCountText: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.subtle,
    },
    driverCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.04,
      shadowRadius: 6,
      elevation: 2,
    },
    driverCardTop: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    driverAvatarCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.md,
    },
    driverAvatarLetter: {
      fontSize: 18,
      fontWeight: '800',
      color: colors.accent,
    },
    driverDetails: {
      flex: 1,
    },
    driverName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    driverSubRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: 2,
    },
    driverOwnerRef: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.subtle,
    },
    driverContactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    driverContactChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.accentSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    driverContactChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.accent,
    },
    driverWhatsAppChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.successSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 5,
      borderRadius: radius.pill,
    },
    driverWhatsAppChipText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.success,
    },
    driverCredsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    driverCredBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.elevated,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.border,
    },
    driverCredLabel: {
      fontSize: 9,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.5,
    },
    driverCredValue: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
    },
    driverVehicleBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.elevated,
      borderRadius: radius.sm,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 7,
      marginTop: spacing.xs + 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    driverVehicleTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    driverVehicleSub: {
      fontSize: 11,
      color: colors.subtle,
      marginTop: 1,
    },
    modalSectionDivider: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.md,
      marginBottom: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    modalSectionDividerTitle: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.8,
    },
    driverFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
    },
    driverEmailText: {
      fontSize: 11,
      color: colors.subtle,
      flex: 1,
      marginRight: spacing.sm,
    },
    driverStatusToggleBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.elevated,
    },
    driverStatusToggleBtnActive: {
      backgroundColor: colors.successSoft,
    },
    driverStatusToggleText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subtle,
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
    tripCardNotePreview: {
      backgroundColor: colors.surface,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.xs,
      marginTop: spacing.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    tripCardNotePreviewText: {
      fontSize: 12,
      color: colors.subtle,
      fontStyle: 'italic',
    },
    cardTapPrompt: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      marginTop: spacing.xs,
    },
    cardTapPromptText: {
      fontSize: 11,
      color: colors.subtle,
      fontWeight: '600',
    },
    inspectSection: {
      marginBottom: spacing.md,
    },
    inspectSectionLabel: {
      fontSize: 11,
      fontWeight: '800',
      color: colors.subtle,
      letterSpacing: 0.8,
      marginBottom: spacing.xs,
      textTransform: 'uppercase',
    },
    inspectCustomerCard: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
    },
    inspectCustomerName: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.text,
    },
    inspectCustomerEmail: {
      fontSize: 12,
      color: colors.subtle,
      marginTop: 2,
    },
    inspectCustomerActions: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    inspectActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inspectActionBtnText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.accent,
    },
    inspectActionBtnWhatsApp: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: colors.whatsappSoft,
      borderWidth: 1,
      borderColor: colors.whatsappBorder,
    },
    inspectActionBtnWhatsAppText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.whatsapp,
    },
    inspectDetailBox: {
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
    },
    inspectGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inspectGridItem: {
      width: '48%',
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    inspectGridLabel: {
      fontSize: 11,
      color: colors.subtle,
    },
    inspectGridVal: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.text,
      flex: 1,
    },
    inspectNotesWrap: {
      marginTop: spacing.sm,
      paddingTop: spacing.xs,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inspectNotesLabel: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.subtle,
      marginBottom: 2,
    },
    inspectNotesText: {
      fontSize: 12,
      color: colors.text,
      fontStyle: 'italic',
    },
    whatsappHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    copiedToast: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.surface,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: radius.xs,
      borderWidth: 1,
      borderColor: colors.success,
    },
    copiedToastText: {
      fontSize: 11,
      fontWeight: '700',
      color: colors.success,
    },
    whatsappTerminal: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: spacing.xs,
    },
    whatsappTerminalText: {
      fontSize: 11,
      color: colors.text,
      fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
      lineHeight: 16,
    },
    whatsappButtonsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    copyWaBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.accent,
      height: 42,
      borderRadius: radius.sm,
    },
    copyWaBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.onAccent,
    },
    openWaBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.whatsappSoft,
      paddingHorizontal: 16,
      height: 42,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: colors.whatsappBorder,
    },
    openWaBtnText: {
      fontSize: 13,
      fontWeight: '700',
      color: colors.whatsapp,
    },
    dispatchStepLabel: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
      marginTop: spacing.xs,
      marginBottom: 6,
    },
    dispatchStepHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.xs,
      marginBottom: 6,
    },
    dispatchStepHint: {
      fontSize: 11,
      fontWeight: '600',
      color: colors.accent,
    },
    selectorChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginRight: spacing.xs,
    },
    selectorChipActive: {
      borderColor: colors.accent,
      backgroundColor: colors.surface,
    },
    selectorChipTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.text,
    },
    selectorChipTitleActive: {
      color: colors.accent,
    },
    selectorChipSub: {
      fontSize: 11,
      color: colors.subtle,
    },
    chipVehicleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 2,
    },
    chipVehicleText: {
      fontSize: 10,
      color: colors.subtle,
      fontWeight: '500',
    },
    chipVehicleTextActive: {
      color: colors.accent,
      fontWeight: '600',
    },
    chipNoVehicleText: {
      fontSize: 10,
      color: colors.error,
      marginTop: 2,
      fontStyle: 'italic',
    },
    autoVehicleBanner: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      backgroundColor: colors.elevated,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.accentSoft,
      padding: spacing.md,
      marginVertical: spacing.xs,
      gap: spacing.sm,
    },
    autoVehicleIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 2,
    },
    autoVehicleTitle: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.accent,
      letterSpacing: 0.8,
    },
    driverOwnerBadge: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.pill,
    },
    driverOwnerBadgeText: {
      fontSize: 9,
      fontWeight: '700',
      color: colors.subtle,
    },
    autoVehicleModel: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.text,
      marginTop: 2,
    },
    autoVehicleSub: {
      fontSize: 11,
      color: colors.subtle,
      marginTop: 2,
    },
    autoVehicleWarning: {
      fontSize: 11,
      color: colors.error,
      marginTop: 2,
    },
    linkedPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.successSoft,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    linkedPillText: {
      fontSize: 10,
      fontWeight: '800',
      color: colors.success,
    },
    priceInput: {
      backgroundColor: colors.elevated,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.sm,
      height: 44,
      paddingHorizontal: 12,
      fontSize: 14,
      fontWeight: '700',
      color: colors.text,
      marginBottom: spacing.sm,
    },
    confirmDispatchBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.accent,
      height: 48,
      borderRadius: radius.md,
      marginTop: spacing.xs,
    },
    confirmDispatchBtnText: {
      fontSize: 14,
      fontWeight: '800',
      color: colors.onAccent,
    },
  });
}
