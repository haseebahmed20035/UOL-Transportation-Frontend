import React, { useContext, useEffect, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { ThemeContext } from '../context/ThemeContext'
import { BASE_URL } from '../services/baseUrl'

const StudentVoucher = ({ navigation }) => {
  const { theme } = useContext(ThemeContext)
  const insets = useSafeAreaInsets()

  const [vouchers, setVouchers] = useState([])
  const [loading, setLoading] = useState(true)
  const [payingId, setPayingId] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedCycles, setSelectedCycles] = useState({})

  const billingCycles = [
    {
      label: 'Monthly',
      value: 'monthly',
      icon: 'calendar-outline',
      multiplier: 1,
    },
    {
      label: 'Quarterly',
      value: 'quarterly',
      icon: 'calendar-number-outline',
      multiplier: 3,
    },
    {
      label: '6 Months',
      value: 'six_months',
      icon: 'hourglass-outline',
      multiplier: 6,
    },
    {
      label: 'Yearly',
      value: 'yearly',
      icon: 'trophy-outline',
      multiplier: 12,
    },
  ]

  const getSelectedCycle = voucherId => {
    return selectedCycles[voucherId] || 'monthly'
  }

  const getSelectedCycleData = voucherId => {
    const selected = getSelectedCycle(voucherId)
    return (
      billingCycles.find(item => item.value === selected) || billingCycles[0]
    )
  }

  const TAX_RATE = 0.16

  const getFeeBreakdown = item => {
    const cycle = getSelectedCycleData(item.voucher_student_id)
    const subtotal = Number(item.amount || 0) * cycle.multiplier
    const tax = subtotal * TAX_RATE
    const total = subtotal + tax

    return {
      subtotal,
      tax,
      total,
    }
  }

  const getPayableAmount = item => {
    return getFeeBreakdown(item).total
  }

  useEffect(() => {
    fetchVouchers()
  }, [])

  const getStudentId = async () => {
    const storedUser = await AsyncStorage.getItem('user')
    const user = storedUser ? JSON.parse(storedUser) : null

    return user?.student_id || user?.studentId || user?.id || user?.user_id
  }

  const fetchVouchers = async () => {
    try {
      const studentId = await getStudentId()

      if (!studentId) {
        Alert.alert('Error', 'Student ID not found. Please login again.')
        return
      }

      const res = await axios.get(
        `${BASE_URL}/fee/student-vouchers/${studentId}`,
      )

      if (res.data?.success) {
        setVouchers(res.data.vouchers || [])
      } else {
        Alert.alert('Error', res.data?.message || 'Failed to load vouchers')
      }
    } catch (error) {
      console.log(
        'Fetch fee vouchers error:',
        error.response?.data || error.message,
      )
      Alert.alert('Error', 'Unable to fetch fee vouchers')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const payVoucher = async voucher => {
    try {
      const selectedCycle = getSelectedCycle(voucher.voucher_student_id)
      const payableAmount = getPayableAmount(voucher)

      setPayingId(voucher.voucher_student_id)

      const res = await axios.post(
        `${BASE_URL}/fee/voucher/${voucher.voucher_student_id}/pay`,
        {
          payment_method: 'hosted_checkout',
          billing_cycle: selectedCycle,
          payable_amount: payableAmount,
        },
      )

      if (res.data?.success && res.data?.checkout_url) {
        await Linking.openURL(res.data.checkout_url)

        Alert.alert(
          'Payment Started',
          'After completing payment, refresh this screen to see updated status.',
        )
      } else {
        Alert.alert('Error', res.data?.message || 'Unable to start payment')
      }
    } catch (error) {
      console.log('Pay voucher error:', error.response?.data || error.message)
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Payment failed to start',
      )
    } finally {
      setPayingId(null)
    }
  }

  const getStatusStyle = status => {
    if (status === 'paid') {
      return {
        bg: 'rgba(33,150,83,0.12)',
        color: '#219653',
        icon: 'checkmark-circle-outline',
        label: 'Paid',
      }
    }

    if (status === 'overdue') {
      return {
        bg: 'rgba(235,87,87,0.12)',
        color: '#EB5757',
        icon: 'alert-circle-outline',
        label: 'Overdue',
      }
    }

    return {
      bg: 'rgba(242,153,74,0.14)',
      color: '#F2994A',
      icon: 'time-outline',
      label: 'Unpaid',
    }
  }

  const formatCycle = value => {
    if (value === 'monthly') return 'Monthly'
    if (value === 'quarterly') return 'Quarterly'
    if (value === 'six_months') return '6 Months'
    if (value === 'yearly') return 'Yearly'
    return value
  }

  const downloadVoucherPdf = async voucher => {
    try {
      const selectedCycle =
        selectedCycles?.[voucher.voucher_student_id] ||
        voucher.selected_billing_cycle ||
        'monthly'

      const url = `${BASE_URL}/fee/voucher/${voucher.voucher_student_id}/pdf?billing_cycle=${selectedCycle}`

      await Linking.openURL(url)
    } catch (error) {
      console.log('Download voucher PDF error:', error)
      Alert.alert('Error', 'Unable to download voucher PDF')
    }
  }

  const renderVoucher = item => {
  const statusStyle = getStatusStyle(item.status)
  const isPaid = item.status === 'paid'

  return (
    <View
      key={item.voucher_student_id}
      style={[
        styles.card,
        {
          backgroundColor: theme.colors.dashboard,
          borderColor: theme.colors.border,
        },
      ]}
    >
      <View style={styles.cardTop}>
        <View style={[styles.iconBox, { backgroundColor: theme.colors.option }]}>
          <Icon
            name="receipt-outline"
            size={26}
            color={theme.colors.primary}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: theme.colors.text }]}>
            {item.title}
          </Text>

          <Text style={[styles.subText, { color: theme.colors.icon }]}>
            {isPaid && item.selected_billing_cycle
              ? `${formatCycle(item.selected_billing_cycle)} Fee`
              : 'Choose payment plan before paying'}
          </Text>
        </View>

        <View style={[styles.statusChip, { backgroundColor: statusStyle.bg }]}>
          <Icon name={statusStyle.icon} size={14} color={statusStyle.color} />
          <Text style={[styles.statusText, { color: statusStyle.color }]}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View
        style={[
          styles.amountBox,
          { backgroundColor: theme.colors.background },
        ]}
      >
        <Text style={[styles.amountLabel, { color: theme.colors.icon }]}>
          Amount
        </Text>
        <Text style={[styles.amount, { color: theme.colors.primary }]}>
          PKR {Number(item.amount || 0).toLocaleString()}
        </Text>
      </View>

      <View style={styles.infoRow}>
        <Icon name="calendar-outline" size={18} color={theme.colors.icon} />
        <Text style={[styles.infoText, { color: theme.colors.text }]}>
          Due Date: {String(item.due_date).slice(0, 10)}
        </Text>
      </View>

      {item.paid_at ? (
        <View style={styles.infoRow}>
          <Icon name="checkmark-done-outline" size={18} color="#219653" />
          <Text style={[styles.infoText, { color: '#219653' }]}>
            Paid At: {String(item.paid_at).slice(0, 19)}
          </Text>
        </View>
      ) : null}

      {item.message ? (
        <Text style={[styles.message, { color: theme.colors.icon }]}>
          {item.message}
        </Text>
      ) : null}

      {!isPaid && (
        <View style={styles.planSection}>
          <Text style={[styles.planTitle, { color: theme.colors.text }]}>
            Select Payment Plan
          </Text>

          <View style={styles.cycleWrap}>
            {billingCycles.map(cycle => {
              const active =
                getSelectedCycle(item.voucher_student_id) === cycle.value

              return (
                <TouchableOpacity
                  key={cycle.value}
                  activeOpacity={0.85}
                  onPress={() =>
                    setSelectedCycles(prev => ({
                      ...prev,
                      [item.voucher_student_id]: cycle.value,
                    }))
                  }
                  style={[
                    styles.cycleChip,
                    {
                      backgroundColor: active
                        ? theme.colors.primary
                        : theme.colors.background,
                      borderColor: active
                        ? theme.colors.primary
                        : theme.colors.border,
                    },
                  ]}
                >
                  <Icon
                    name={cycle.icon}
                    size={16}
                    color={active ? theme.colors.headerText : theme.colors.icon}
                  />

                  <Text
                    style={[
                      styles.cycleText,
                      {
                        color: active
                          ? theme.colors.headerText
                          : theme.colors.text,
                      },
                    ]}
                  >
                    {cycle.label}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </View>

          <View
            style={[
              styles.payableBox,
              { backgroundColor: theme.colors.option },
            ]}
          >
            <View style={styles.amountLine}>
              <Text style={[styles.payableLabel, { color: theme.colors.icon }]}>
                Base Fee
              </Text>
              <Text style={[styles.payableValue, { color: theme.colors.text }]}>
                PKR {getFeeBreakdown(item).subtotal.toLocaleString()}
              </Text>
            </View>

            <View style={styles.amountLine}>
              <Text style={[styles.payableLabel, { color: theme.colors.icon }]}>
                Tax 16%
              </Text>
              <Text style={[styles.payableValue, { color: theme.colors.text }]}>
                PKR {getFeeBreakdown(item).tax.toLocaleString()}
              </Text>
            </View>

            <View
              style={[
                styles.totalDivider,
                { backgroundColor: theme.colors.border },
              ]}
            />

            <View style={styles.amountLine}>
              <Text style={[styles.totalLabel, { color: theme.colors.primary }]}>
                Total Payable
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.primary }]}>
                PKR {getFeeBreakdown(item).total.toLocaleString()}
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => downloadVoucherPdf(item)}
        style={[
          styles.pdfBtn,
          {
            backgroundColor: theme.colors.option,
            borderColor: theme.colors.primary,
          },
        ]}
      >
        <Icon name="download-outline" size={20} color={theme.colors.primary} />
        <Text style={[styles.pdfText, { color: theme.colors.primary }]}>
          Download PDF Voucher
        </Text>
      </TouchableOpacity>

      {!isPaid && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => payVoucher(item)}
          disabled={payingId === item.voucher_student_id}
          style={[
            styles.payBtn,
            {
              backgroundColor: theme.colors.primary,
              opacity: payingId === item.voucher_student_id ? 0.7 : 1,
            },
          ]}
        >
          {payingId === item.voucher_student_id ? (
            <ActivityIndicator color={theme.colors.headerText} />
          ) : (
            <>
              <Icon
                name="card-outline"
                size={20}
                color={theme.colors.headerText}
              />
              <Text style={[styles.payText, { color: theme.colors.headerText }]}>
                Pay Now
              </Text>
            </>
          )}
        </TouchableOpacity>
      )}
    </View>
  )
}

  return (
    <SafeAreaView
      style={[styles.safeArea, { backgroundColor: theme.colors.background }]}
      edges={['left', 'right', 'bottom']}
    >
      <View
        style={[
          styles.header,
          {
            backgroundColor: theme.colors.primary,
            paddingTop: insets.top + 12,
          },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name='arrow-back' size={26} color={theme.colors.headerText} />
        </TouchableOpacity>

        <Text style={[styles.headerText, { color: theme.colors.headerText }]}>
          Fee Vouchers
        </Text>

        <TouchableOpacity onPress={fetchVouchers}>
          <Icon
            name='refresh-outline'
            size={24}
            color={theme.colors.headerText}
          />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator size='large' color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.icon }]}>
            Loading fee vouchers...
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true)
                fetchVouchers()
              }}
            />
          }
        >
          {vouchers.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                {
                  backgroundColor: theme.colors.dashboard,
                  borderColor: theme.colors.border,
                },
              ]}
            >
              <Icon
                name='receipt-outline'
                size={46}
                color={theme.colors.icon}
              />
              <Text style={[styles.emptyTitle, { color: theme.colors.text }]}>
                No Fee Voucher Found
              </Text>
              <Text style={[styles.emptySub, { color: theme.colors.icon }]}>
                Your fee vouchers will appear here once admin sends them.
              </Text>
            </View>
          ) : (
            vouchers.map(renderVoucher)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

export default StudentVoucher

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingBottom: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    fontSize: 18,
    fontWeight: '900',
  },

  scrollContent: {
    padding: 16,
  },

  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  loadingText: {
    marginTop: 10,
    fontSize: 13,
    fontWeight: '600',
  },

  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginBottom: 14,
  },

  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },

  title: {
    fontSize: 15,
    fontWeight: '900',
  },

  subText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '600',
  },

  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 6,
    gap: 4,
  },

  statusText: {
    fontSize: 11,
    fontWeight: '900',
  },

  amountBox: {
    padding: 14,
    borderRadius: 16,
    marginTop: 14,
  },

  amountLabel: {
    fontSize: 12,
    fontWeight: '700',
  },

  amount: {
    marginTop: 4,
    fontSize: 22,
    fontWeight: '900',
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },

  infoText: {
    fontSize: 13,
    fontWeight: '700',
  },

  message: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
  },

  emptyCard: {
    borderWidth: 1,
    borderRadius: 22,
    padding: 28,
    alignItems: 'center',
    marginTop: 40,
  },

  emptyTitle: {
    fontSize: 17,
    fontWeight: '900',
    marginTop: 12,
  },

  emptySub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  planSection: {
  marginTop: 16,
},

planTitle: {
  fontSize: 13,
  fontWeight: '900',
  marginBottom: 10,
},

cycleWrap: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  rowGap: 10,
},

cycleChip: {
  width: '48%',
  minHeight: 42,
  flexDirection: 'row',
  alignItems: 'center',
  justifyContent: 'center',
  borderWidth: 1,
  paddingHorizontal: 8,
  paddingVertical: 9,
  borderRadius: 14,
  gap: 6,
},

cycleText: {
  fontSize: 12,
  fontWeight: '800',
},

payableBox: {
  marginTop: 12,
  padding: 14,
  borderRadius: 15,
},

amountLine: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
},

payableLabel: {
  fontSize: 12,
  fontWeight: '700',
},

payableValue: {
  fontSize: 13,
  fontWeight: '800',
},

totalDivider: {
  height: 1,
  marginVertical: 8,
},

totalLabel: {
  fontSize: 13,
  fontWeight: '900',
},

totalValue: {
  fontSize: 15,
  fontWeight: '900',
},

pdfBtn: {
  minHeight: 48,
  borderRadius: 16,
  borderWidth: 1,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: 8,
  marginTop: 14,
  paddingHorizontal: 12,
},

pdfText: {
  fontSize: 14,
  fontWeight: '900',
},

payBtn: {
  minHeight: 52,
  borderRadius: 16,
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'row',
  gap: 8,
  marginTop: 12,
  paddingHorizontal: 12,
},

payText: {
  fontSize: 15,
  fontWeight: '900',
},
})
