// import React, { useState, useEffect } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   TouchableOpacity,
//   TextInput,
//   ScrollView,
//   Alert,
//   ActivityIndicator,
// } from 'react-native';
// import { SafeAreaView } from 'react-native-safe-area-context';
// import firestore from '@react-native-firebase/firestore';
// import auth from '@react-native-firebase/auth';
// import LinearGradient from 'react-native-linear-gradient';

// const CATEGORIES = [
//   { name: 'Food', icon: '🍔', default: 5000 },
//   { name: 'Travel', icon: '🚕', default: 3000 },
//   { name: 'Shopping', icon: '🛒', default: 2000 },
//   { name: 'Health', icon: '💊', default: 2000 },
//   { name: 'Bills', icon: '📱', default: 4000 },
//   { name: 'Entertainment', icon: '🎬', default: 2000 },
//   { name: 'Rent', icon: '🏠', default: 10000 },
//   { name: 'Other', icon: '💰', default: 2000 },
// ];

// export default function BudgetSetupScreen({ navigation, route }: any) {
//   // Get params or fallback to current user
//   const [uid, setUid] = useState<string | null>(null);
//   const [email, setEmail] = useState('');
//   const [displayName, setDisplayName] = useState('');
  
//   const [monthlyBudget, setMonthlyBudget] = useState('15000');
//   const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>(
//     CATEGORIES.reduce((acc, cat) => ({ ...acc, [cat.name]: cat.default.toString() }), {})
//   );
//   const [loading, setLoading] = useState(false);

//   useEffect(() => {
//     // Get user info from route params or from auth
//     const user = auth().currentUser;
    
//     if (route.params && route.params.uid) {
//       // Use params from navigation
//       setUid(route.params.uid);
//       setEmail(route.params.email || '');
//       setDisplayName(route.params.displayName || '');
//     } else if (user) {
//       // Fallback to current authenticated user
//       setUid(user.uid);
//       setEmail(user.email || '');
//       setDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
//     } else {
//       // No user found - go back to login
//       Alert.alert('Error', 'Please sign up first', [
//         { text: 'OK', onPress: () => navigation.replace('Login') }
//       ]);
//     }
//   }, [route.params]);

//   const updateCategoryBudget = (category: string, value: string) => {
//     setCategoryBudgets(prev => ({ ...prev, [category]: value }));
//   };

//   const handleSave = async () => {
//     if (!uid) {
//       Alert.alert('Error', 'User not found. Please sign up again.');
//       navigation.replace('Login');
//       return;
//     }

//     const monthlyNum = parseFloat(monthlyBudget);
//     if (isNaN(monthlyNum) || monthlyNum <= 0) {
//       Alert.alert('Error', 'Please enter a valid monthly budget');
//       return;
//     }

//     setLoading(true);

//     try {
//       // Parse category budgets to numbers
//       const parsedCategoryBudgets: Record<string, number> = {};
//       Object.entries(categoryBudgets).forEach(([key, value]) => {
//         parsedCategoryBudgets[key] = parseFloat(value) || 0;
//       });

//       // Save user data to Firestore
//       await firestore().collection('users').doc(uid).set({
//         displayName: displayName || email?.split('@')[0] || 'User',
//         email: email,
//         monthlyBudget: monthlyNum,
//         categoryBudgets: parsedCategoryBudgets,
//         createdAt: firestore.FieldValue.serverTimestamp(),
//       });

//       Alert.alert(
//         'Welcome to SpendWise! 🎉',
//         'Your budget has been set up successfully!',
//         [
//           {
//             text: 'Start Tracking',
//             onPress: () => {
//               navigation.replace('Main');
//             }
//           }
//         ]
//       );
//     } catch (error: any) {
//       console.error('Error saving budget:', error);
//       Alert.alert('Error', 'Failed to save budget. Please try again.');
//     } finally {
//       setLoading(false);
//     }
//   };

//   const totalCategoryBudget = Object.values(categoryBudgets).reduce(
//     (sum, val) => sum + (parseFloat(val) || 0),
//     0
//   );
//   const monthlyBudgetNum = parseFloat(monthlyBudget) || 0;
//   const remaining = monthlyBudgetNum - totalCategoryBudget;

//   if (!uid) {
//     return (
//       <SafeAreaView style={styles.safe}>
//         <View style={styles.loadingContainer}>
//           <ActivityIndicator size="large" color="#1A9B5E" />
//           <Text style={styles.loadingText}>Loading...</Text>
//         </View>
//       </SafeAreaView>
//     );
//   }


  

//   return (
//     <SafeAreaView style={styles.safe}>
//       <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
//         <LinearGradient
//           colors={['#0a4f3c', '#1A9B5E']}
//           start={{ x: 0, y: 0 }}
//           end={{ x: 1, y: 1 }}
//           style={styles.header}
//         >
//           <Text style={styles.title}>Set Your Budget</Text>
//           <Text style={styles.subtitle}>Customize your spending limits</Text>
//         </LinearGradient>

//         <View style={styles.content}>
//           {/* Monthly Budget */}
//           <View style={styles.inputGroup}>
//             <Text style={styles.label}>💰 Monthly Budget (₹)</Text>
//             <TextInput
//               style={styles.input}
//               value={monthlyBudget}
//               onChangeText={setMonthlyBudget}
//               keyboardType="numeric"
//               placeholder="Enter monthly budget"
//               placeholderTextColor="#999"
//             />
//           </View>

//           {/* Category Budgets */}
//           <Text style={styles.sectionTitle}>📋 Category Budgets</Text>
//           <Text style={styles.sectionNote}>Set monthly limits for each category</Text>

//           {CATEGORIES.map(category => (
//             <View key={category.name} style={styles.categoryRow}>
//               <View style={styles.categoryInfo}>
//                 <Text style={styles.categoryIcon}>{category.icon}</Text>
//                 <Text style={styles.categoryLabel}>{category.name}</Text>
//               </View>
//               <View style={styles.categoryInputWrapper}>
//                 <Text style={styles.rupeeSymbol}>₹</Text>
//                 <TextInput
//                   style={styles.categoryInput}
//                   value={categoryBudgets[category.name]}
//                   onChangeText={(val) => updateCategoryBudget(category.name, val)}
//                   keyboardType="numeric"
//                   placeholder="0"
//                   placeholderTextColor="#999"
//                 />
//               </View>
//             </View>
//           ))}

//           {/* Budget Summary */}
//           <View style={styles.summaryCard}>
//             <Text style={styles.summaryTitle}>Budget Summary</Text>
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>Total Monthly Budget:</Text>
//               <Text style={styles.summaryValue}>₹{monthlyBudgetNum.toLocaleString('en-IN')}</Text>
//             </View>
//             <View style={styles.summaryRow}>
//               <Text style={styles.summaryLabel}>Total Category Budgets:</Text>
//               <Text style={styles.summaryValue}>₹{totalCategoryBudget.toLocaleString('en-IN')}</Text>
//             </View>
//             <View style={[styles.summaryRow, remaining < 0 && styles.warningRow]}>
//               <Text style={styles.summaryLabel}>Remaining for Other:</Text>
//               <Text style={[styles.summaryValue, remaining < 0 && styles.warningText]}>
//                 ₹{remaining.toLocaleString('en-IN')}
//               </Text>
//             </View>
//             {remaining < 0 && (
//               <Text style={styles.warningMessage}>
//                 ⚠️ Category budgets exceed monthly budget!
//               </Text>
//             )}
//           </View>

//           {/* Save Button */}
//           <TouchableOpacity
//             style={[styles.saveBtn, loading && styles.disabledBtn]}
//             onPress={handleSave}
//             disabled={loading}
//             activeOpacity={0.85}
//           >
//             {loading ? (
//               <ActivityIndicator color="#fff" />
//             ) : (
//               <Text style={styles.saveBtnText}>Create Account & Start Tracking</Text>
//             )}
//           </TouchableOpacity>
//         </View>
//       </ScrollView>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safe: {
//     flex: 1,
//     backgroundColor: '#f5f5f5',
//   },
//   container: {
//     flexGrow: 1,
//   },
//   header: {
//     paddingHorizontal: 24,
//     paddingTop: 40,
//     paddingBottom: 32,
//     borderBottomLeftRadius: 28,
//     borderBottomRightRadius: 28,
//   },
//   title: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     color: '#ffffff',
//     textAlign: 'center',
//     marginBottom: 8,
//   },
//   subtitle: {
//     fontSize: 14,
//     color: 'rgba(255,255,255,0.8)',
//     textAlign: 'center',
//   },
//   content: {
//     padding: 20,
//   },
//   inputGroup: {
//     marginBottom: 24,
//   },
//   label: {
//     fontSize: 16,
//     fontWeight: '600',
//     color: '#333',
//     marginBottom: 10,
//   },
//   input: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     padding: 14,
//     fontSize: 16,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   sectionTitle: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//     marginTop: 8,
//     marginBottom: 4,
//   },
//   sectionNote: {
//     fontSize: 12,
//     color: '#999',
//     marginBottom: 16,
//   },
//   categoryRow: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     justifyContent: 'space-between',
//     backgroundColor: '#fff',
//     paddingHorizontal: 16,
//     paddingVertical: 12,
//     borderRadius: 12,
//     marginBottom: 8,
//     borderWidth: 1,
//     borderColor: '#e0e0e0',
//   },
//   categoryInfo: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     gap: 12,
//   },
//   categoryIcon: {
//     fontSize: 24,
//   },
//   categoryLabel: {
//     fontSize: 15,
//     fontWeight: '500',
//     color: '#333',
//   },
//   categoryInputWrapper: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#f5f5f5',
//     borderRadius: 8,
//     paddingHorizontal: 10,
//   },
//   rupeeSymbol: {
//     fontSize: 14,
//     color: '#666',
//     marginRight: 4,
//   },
//   categoryInput: {
//     width: 80,
//     paddingVertical: 10,
//     fontSize: 14,
//     textAlign: 'right',
//   },
//   summaryCard: {
//     backgroundColor: '#E8F7F0',
//     borderRadius: 16,
//     padding: 16,
//     marginTop: 20,
//     marginBottom: 24,
//   },
//   summaryTitle: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#1A9B5E',
//     marginBottom: 12,
//   },
//   summaryRow: {
//     flexDirection: 'row',
//     justifyContent: 'space-between',
//     marginBottom: 8,
//   },
//   summaryLabel: {
//     fontSize: 14,
//     color: '#555',
//   },
//   summaryValue: {
//     fontSize: 14,
//     fontWeight: '600',
//     color: '#333',
//   },
//   warningRow: {
//     borderTopWidth: 1,
//     borderTopColor: '#ffcccc',
//     marginTop: 8,
//     paddingTop: 8,
//   },
//   warningText: {
//     color: '#E53E3E',
//   },
//   warningMessage: {
//     fontSize: 12,
//     color: '#E53E3E',
//     marginTop: 8,
//     textAlign: 'center',
//   },
//   saveBtn: {
//     backgroundColor: '#1A9B5E',
//     borderRadius: 14,
//     paddingVertical: 16,
//     alignItems: 'center',
//     marginBottom: 20,
//     shadowColor: '#1A9B5E',
//     shadowOpacity: 0.3,
//     shadowRadius: 8,
//     shadowOffset: { width: 0, height: 4 },
//     elevation: 5,
//   },
//   disabledBtn: {
//     opacity: 0.7,
//   },
//   saveBtnText: {
//     color: '#fff',
//     fontSize: 16,
//     fontWeight: 'bold',
//   },
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   loadingText: {
//     marginTop: 10,
//     fontSize: 14,
//     color: '#666',
//   },
// });


import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import LinearGradient from 'react-native-linear-gradient';

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: '🍔', default: 5000 },
  { name: 'Travel', icon: '🚕', default: 3000 },
  { name: 'Shopping', icon: '🛒', default: 2000 },
  { name: 'Health', icon: '💊', default: 2000 },
  { name: 'Bills', icon: '📱', default: 4000 },
  { name: 'Entertainment', icon: '🎬', default: 2000 },
  { name: 'Rent', icon: '🏠', default: 10000 },
  { name: 'Other', icon: '💰', default: 2000 },
];

// Predefined icons for custom categories
const ICON_OPTIONS = [
  '🍔', '🚕', '🛒', '💊', '📱', '🎬', '🏠', '💰', '🍕', '☕', 
  '🎮', '📚', '💪', '🎵', '✈️', '🏨', '🎁', '💻', '⌚', '👕',
  '🐶', '🐱', '🌱', '💡', '🔧', '📷', '🎨', '⚽', '🏀', '🎾'
];

export default function BudgetSetupScreen({ navigation, route }: any) {
  const [uid, setUid] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  
  const [monthlyBudget, setMonthlyBudget] = useState('15000');
  const [categoryBudgets, setCategoryBudgets] = useState<Record<string, string>>({});
  const [customCategories, setCustomCategories] = useState<Array<{name: string, icon: string, budget: string}>>([]);
  const [loading, setLoading] = useState(false);
  
  // Modal states for adding custom category
  const [modalVisible, setModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('📌');
  const [newCategoryBudget, setNewCategoryBudget] = useState('1000');
  const [showIconPicker, setShowIconPicker] = useState(false);

  useEffect(() => {
    const user = auth().currentUser;
    
    if (route.params && route.params.uid) {
      setUid(route.params.uid);
      setEmail(route.params.email || '');
      setDisplayName(route.params.displayName || '');
    } else if (user) {
      setUid(user.uid);
      setEmail(user.email || '');
      setDisplayName(user.displayName || user.email?.split('@')[0] || 'User');
    } else {
      Alert.alert('Error', 'Please sign up first', [
        { text: 'OK', onPress: () => navigation.replace('Login') }
      ]);
    }

    // Initialize default categories
    const initialBudgets: Record<string, string> = {};
    DEFAULT_CATEGORIES.forEach(cat => {
      initialBudgets[cat.name] = cat.default.toString();
    });
    setCategoryBudgets(initialBudgets);
  }, [route.params]);

  const updateCategoryBudget = (category: string, value: string) => {
    setCategoryBudgets(prev => ({ ...prev, [category]: value }));
  };

  const updateCustomCategoryBudget = (index: number, value: string) => {
    const updated = [...customCategories];
    updated[index].budget = value;
    setCustomCategories(updated);
  };

  const addCustomCategory = () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    const categoryName = newCategoryName.trim();
    if (categoryBudgets[categoryName] || customCategories.some(c => c.name === categoryName)) {
      Alert.alert('Error', 'Category already exists');
      return;
    }

    const newCategory = {
      name: categoryName,
      icon: newCategoryIcon,
      budget: newCategoryBudget,
    };

    setCustomCategories([...customCategories, newCategory]);
    setCategoryBudgets(prev => ({ ...prev, [categoryName]: newCategoryBudget }));
    
    // Reset modal
    setNewCategoryName('');
    setNewCategoryIcon('📌');
    setNewCategoryBudget('1000');
    setModalVisible(false);
  };

  const removeCustomCategory = (index: number, categoryName: string) => {
    Alert.alert(
      'Remove Category',
      `Are you sure you want to remove "${categoryName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: () => {
            const updated = [...customCategories];
            updated.splice(index, 1);
            setCustomCategories(updated);
            
            const newBudgets = { ...categoryBudgets };
            delete newBudgets[categoryName];
            setCategoryBudgets(newBudgets);
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!uid) {
      Alert.alert('Error', 'User not found. Please sign up again.');
      navigation.replace('Login');
      return;
    }

    const monthlyNum = parseFloat(monthlyBudget);
    if (isNaN(monthlyNum) || monthlyNum <= 0) {
      Alert.alert('Error', 'Please enter a valid monthly budget');
      return;
    }

    setLoading(true);

    try {
      // Parse all category budgets to numbers
      const parsedCategoryBudgets: Record<string, number> = {};
      Object.entries(categoryBudgets).forEach(([key, value]) => {
        parsedCategoryBudgets[key] = parseFloat(value) || 0;
      });
      
      // Add custom categories
      customCategories.forEach(cat => {
        parsedCategoryBudgets[cat.name] = parseFloat(cat.budget) || 0;
      });

      await firestore().collection('users').doc(uid).set({
        displayName: displayName || email?.split('@')[0] || 'User',
        email: email,
        monthlyBudget: monthlyNum,
        categoryBudgets: parsedCategoryBudgets,
        customCategories: customCategories.map(c => ({ name: c.name, icon: c.icon })),
        createdAt: firestore.FieldValue.serverTimestamp(),
      });

      Alert.alert(
        'Welcome to SpendWise! 🎉',
        'Your budget has been set up successfully!',
        [{ text: 'Start Tracking', onPress: () => navigation.replace('Main') }]
      );
    } catch (error: any) {
      console.error('Error saving budget:', error);
      Alert.alert('Error', 'Failed to save budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const totalCategoryBudget = Object.values(categoryBudgets).reduce(
    (sum, val) => sum + (parseFloat(val) || 0), 0
  ) + customCategories.reduce((sum, cat) => sum + (parseFloat(cat.budget) || 0), 0);
  
  const monthlyBudgetNum = parseFloat(monthlyBudget) || 0;
  const remaining = monthlyBudgetNum - totalCategoryBudget;

  const renderIconPicker = () => (
    <Modal
      animationType="slide"
      transparent={true}
      visible={showIconPicker}
      onRequestClose={() => setShowIconPicker(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Choose an Icon</Text>
          <FlatList
            data={ICON_OPTIONS}
            numColumns={5}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.iconOption, newCategoryIcon === item && styles.iconOptionSelected]}
                onPress={() => {
                  setNewCategoryIcon(item);
                  setShowIconPicker(false);
                }}
              >
                <Text style={styles.iconOptionText}>{item}</Text>
              </TouchableOpacity>
            )}
          />
          <TouchableOpacity
            style={styles.closeModalBtn}
            onPress={() => setShowIconPicker(false)}
          >
            <Text style={styles.closeModalBtnText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  if (!uid) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A9B5E" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <LinearGradient
          colors={['#0a4f3c', '#1A9B5E']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.header}
        >
          <Text style={styles.title}>Set Your Budget</Text>
          <Text style={styles.subtitle}>Customize your spending limits</Text>
        </LinearGradient>

        <View style={styles.content}>
          {/* Monthly Budget */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>💰 Monthly Budget (₹)</Text>
            <TextInput
              style={styles.input}
              value={monthlyBudget}
              onChangeText={setMonthlyBudget}
              keyboardType="numeric"
              placeholder="Enter monthly budget"
              placeholderTextColor="#999"
            />
          </View>

          {/* Default Categories */}
          <Text style={styles.sectionTitle}>📋 Category Budgets</Text>
          <Text style={styles.sectionNote}>Set monthly limits for each category</Text>

          {DEFAULT_CATEGORIES.map(category => (
            <View key={category.name} style={styles.categoryRow}>
              <View style={styles.categoryInfo}>
                <Text style={styles.categoryIcon}>{category.icon}</Text>
                <Text style={styles.categoryLabel}>{category.name}</Text>
              </View>
              <View style={styles.categoryInputWrapper}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <TextInput
                  style={styles.categoryInput}
                  value={categoryBudgets[category.name]}
                  onChangeText={(val) => updateCategoryBudget(category.name, val)}
                  keyboardType="numeric"
                  placeholder="0"
                  placeholderTextColor="#999"
                />
              </View>
            </View>
          ))}

          {/* Custom Categories */}
          {customCategories.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, styles.customSectionTitle]}>✨ Custom Categories</Text>
              {customCategories.map((category, index) => (
                <View key={index} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryLabel}>{category.name}</Text>
                  </View>
                  <View style={styles.categoryInputWrapper}>
                    <Text style={styles.rupeeSymbol}>₹</Text>
                    <TextInput
                      style={styles.categoryInput}
                      value={category.budget}
                      onChangeText={(val) => updateCustomCategoryBudget(index, val)}
                      keyboardType="numeric"
                      placeholder="0"
                      placeholderTextColor="#999"
                    />
                  </View>
                  <TouchableOpacity
                    onPress={() => removeCustomCategory(index, category.name)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {/* Add Custom Category Button */}
          <TouchableOpacity
            style={styles.addCategoryBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addCategoryBtnText}>+ Add Custom Category</Text>
          </TouchableOpacity>

          {/* Budget Summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Budget Summary</Text>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Monthly Budget:</Text>
              <Text style={styles.summaryValue}>₹{monthlyBudgetNum.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Category Budgets:</Text>
              <Text style={styles.summaryValue}>₹{totalCategoryBudget.toLocaleString('en-IN')}</Text>
            </View>
            <View style={[styles.summaryRow, remaining < 0 && styles.warningRow]}>
              <Text style={styles.summaryLabel}>Remaining for Other:</Text>
              <Text style={[styles.summaryValue, remaining < 0 && styles.warningText]}>
                ₹{remaining.toLocaleString('en-IN')}
              </Text>
            </View>
            {remaining < 0 && (
              <Text style={styles.warningMessage}>
                ⚠️ Category budgets exceed monthly budget!
              </Text>
            )}
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, loading && styles.disabledBtn]}
            onPress={handleSave}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Create Account & Start Tracking</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Add Category Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Category</Text>
            
            <Text style={styles.modalLabel}>Category Name</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryName}
              onChangeText={setNewCategoryName}
              placeholder="e.g., Coffee, Gym, Subscription"
              placeholderTextColor="#999"
            />
            
            <Text style={styles.modalLabel}>Category Icon</Text>
            <TouchableOpacity
              style={styles.iconPickerBtn}
              onPress={() => setShowIconPicker(true)}
            >
              <Text style={styles.iconPickerText}>{newCategoryIcon}</Text>
              <Text style={styles.iconPickerChange}>Change</Text>
            </TouchableOpacity>
            
            <Text style={styles.modalLabel}>Monthly Budget (₹)</Text>
            <TextInput
              style={styles.modalInput}
              value={newCategoryBudget}
              onChangeText={setNewCategoryBudget}
              keyboardType="numeric"
              placeholder="Enter budget"
              placeholderTextColor="#999"
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelModalBtn]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelModalBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.addModalBtn]}
                onPress={addCustomCategory}
              >
                <Text style={styles.addModalBtnText}>Add Category</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Icon Picker Modal */}
      {renderIconPicker()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f5f5' },
  container: { flexGrow: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#ffffff', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center' },
  content: { padding: 20 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginTop: 8, marginBottom: 4 },
  customSectionTitle: { marginTop: 20, color: '#1A9B5E' },
  sectionNote: { fontSize: 12, color: '#999', marginBottom: 16 },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  categoryInfo: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  categoryIcon: { fontSize: 24 },
  categoryLabel: { fontSize: 15, fontWeight: '500', color: '#333' },
  categoryInputWrapper: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, paddingHorizontal: 10 },
  rupeeSymbol: { fontSize: 14, color: '#666', marginRight: 4 },
  categoryInput: { width: 80, paddingVertical: 10, fontSize: 14, textAlign: 'right' },
  removeBtn: { padding: 8, marginLeft: 8 },
  removeBtnText: { fontSize: 16 },
  addCategoryBtn: {
    backgroundColor: '#E8F7F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#1A9B5E',
    borderStyle: 'dashed',
  },
  addCategoryBtnText: { color: '#1A9B5E', fontSize: 14, fontWeight: '600' },
  summaryCard: {
    backgroundColor: '#E8F7F0',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 24,
  },
  summaryTitle: { fontSize: 16, fontWeight: 'bold', color: '#1A9B5E', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#555' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#333' },
  warningRow: { borderTopWidth: 1, borderTopColor: '#ffcccc', marginTop: 8, paddingTop: 8 },
  warningText: { color: '#E53E3E' },
  warningMessage: { fontSize: 12, color: '#E53E3E', marginTop: 8, textAlign: 'center' },
  saveBtn: {
    backgroundColor: '#1A9B5E',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#1A9B5E',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  disabledBtn: { opacity: 0.7 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 10, fontSize: 14, color: '#666' },
  
  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 20, padding: 20, width: '85%', maxHeight: '80%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#333', textAlign: 'center', marginBottom: 20 },
  modalLabel: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 5, marginTop: 10 },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  iconPickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  iconPickerText: { fontSize: 30 },
  iconPickerChange: { fontSize: 14, color: '#1A9B5E', fontWeight: '500' },
  modalButtons: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalButton: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  cancelModalBtn: { backgroundColor: '#f0f0f0' },
  cancelModalBtnText: { color: '#666', fontWeight: '600' },
  addModalBtn: { backgroundColor: '#1A9B5E' },
  addModalBtnText: { color: '#fff', fontWeight: '600' },
  closeModalBtn: { marginTop: 15, paddingVertical: 10, alignItems: 'center' },
  closeModalBtnText: { color: '#999', fontWeight: '500' },
  
  // Icon Picker
  iconOption: { width: 50, height: 50, justifyContent: 'center', alignItems: 'center', margin: 5, borderRadius: 10, backgroundColor: '#f5f5f5' },
  iconOptionSelected: { backgroundColor: '#1A9B5E', borderWidth: 2, borderColor: '#fff' },
  iconOptionText: { fontSize: 28 },
});