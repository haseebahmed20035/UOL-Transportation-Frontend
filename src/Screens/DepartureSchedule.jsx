import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useState, useContext } from 'react';
import Icon from 'react-native-vector-icons/Ionicons';
import { routesByDay, getTodayId } from '../data/RouteModel';
import { ThemeContext } from '../context/ThemeContext';

// 🔥 CURRENT WEEK GENERATOR (MON–SUN)
const getCurrentWeek = () => {
  const today = new Date();
  const jsDay = today.getDay();

  const monday = new Date(today);
  monday.setDate(today.getDate() - (jsDay === 0 ? 6 : jsDay - 1));

  const week = [];

  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);

    week.push({
      id: i + 1,
      day: d.toLocaleDateString('en-US', { weekday: 'short' }),
      date:
        d.getDate() +
        ' ' +
        d.toLocaleDateString('en-US', { month: 'short' }),
    });
  }

  return week;
};

const DepartureSchedule = ({ navigation }) => {
  const { theme } = useContext(ThemeContext);

  const weekDays = getCurrentWeek();
  const [enableDay, setEnableDay] = useState(getTodayId());

  const selectedDay = weekDays.find(d => d.id === enableDay);
  const route = routesByDay?.[enableDay] ?? null;
  const noService = route?.noService === true;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
      ]}
    >
      {/* HEADER */}
      <View
        style={[
          styles.header,
          { backgroundColor: theme.colors.primary },
        ]}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={26} color={theme.colors.icon} />
        </TouchableOpacity>

        <Text
          style={[
            styles.headerText,
            { color: theme.colors.icon },
          ]}
        >
          Departure Schedule
        </Text>

        <View style={{ width: 26 }} />
      </View>

      {/* WEEK SELECTOR */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {weekDays.map(item => {
          const noRoute = routesByDay?.[item.id]?.noService;

          return (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.dateBox,
                { backgroundColor: theme.colors.box },
                enableDay === item.id && {
                  backgroundColor: theme.colors.primary,
                },
                noRoute && { opacity: 0.5 },
              ]}
              onPress={() => setEnableDay(item.id)}
            >
              <Text
                style={[
                  styles.dayText,
                  {
                    color:
                      enableDay === item.id
                        ? '#fff'
                        : theme.colors.text,
                  },
                ]}
              >
                {item.day}
              </Text>

              <Text
                style={[
                  styles.dateText,
                  {
                    color:
                      enableDay === item.id
                        ? '#fff'
                        : theme.colors.text,
                  },
                ]}
              >
                {item.date}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* CONTENT */}
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.scheduleCard,
            { backgroundColor: theme.colors.option },
          ]}
        >
          <Text
            style={[
              styles.cardTitle,
              { color: theme.colors.text },
            ]}
          >
            Schedule for {selectedDay?.day}
          </Text>

          {noService ? (
            <View style={styles.noServiceContainer}>
              <Icon name="close-circle-outline" size={50} color="#DC3545" />

              <Text
                style={[
                  styles.noBusTitle,
                  { color: theme.colors.text },
                ]}
              >
                No Bus Assigned
              </Text>

              <Text
                style={[
                  styles.noBusSub,
                  { color: theme.colors.border },
                ]}
              >
                Bus service is not available on {selectedDay?.day}
              </Text>
            </View>
          ) : (
            <>
              {/* ROUTE TITLE */}
              <View style={styles.infoRow}>
                <Icon
                  name="navigate-outline"
                  size={20}
                  color={theme.colors.icon}
                />
                <Text
                  style={[
                    styles.infoText,
                    { color: theme.colors.text },
                  ]}
                >
                  {route?.departure?.title}
                </Text>
              </View>

              {/* DEPARTURE TIMES */}
              <Text
                style={[
                  styles.subTitle,
                  { color: theme.colors.text },
                ]}
              >
                Departure from University
              </Text>

              {route?.departure?.timings?.map((time, index) => (
                <View key={index} style={styles.infoRow}>
                  <Icon
                    name="bus-outline"
                    size={20}
                    color={theme.colors.icon}
                  />
                  <Text
                    style={[
                      styles.infoText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {time}
                  </Text>
                </View>
              ))}

              <View
                style={[
                  styles.divider,
                  { backgroundColor: theme.colors.border },
                ]}
              />

              {/* ROUTE STOPS */}
              <Text
                style={[
                  styles.subTitle,
                  { color: theme.colors.text },
                ]}
              >
                Route Stops
              </Text>

              {route?.stops?.map((stop, index) => (
                <View key={index} style={styles.stopRow}>
                  <View style={styles.timeline}>
                    <View
                      style={[
                        styles.dot,
                        { backgroundColor: theme.colors.primary },
                      ]}
                    />
                    {index !== route.stops.length - 1 && (
                      <View
                        style={[
                          styles.line,
                          { backgroundColor: theme.colors.primary },
                        ]}
                      />
                    )}
                  </View>

                  <Text
                    style={[
                      styles.stopText,
                      { color: theme.colors.text },
                    ]}
                  >
                    {stop.name}
                  </Text>
                </View>
              ))}
            </>
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default DepartureSchedule;

/* STYLES */
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  header: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  headerText: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  dateRow: {
    paddingVertical: 14,
    paddingHorizontal: 12,
  },

  dateBox: {
    height: 80,
    width: 68,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    elevation: 2,
  },

  dayText: {
    fontSize: 14,
    fontWeight: '600',
  },

  dateText: {
    fontSize: 13,
    fontWeight: 'bold',
    marginTop: 2,
  },

  content: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },

  scheduleCard: {
    borderRadius: 16,
    padding: 16,
    elevation: 3,
  },

  cardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginBottom: 14,
  },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },

  infoText: {
    fontSize: 15,
    fontWeight: '600',
  },

  subTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 6,
    marginBottom: 6,
  },

  divider: {
    height: 1,
    marginVertical: 12,
  },

  stopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },

  timeline: {
    width: 20,
    alignItems: 'center',
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },

  line: {
    width: 2,
    height: 28,
    marginTop: 2,
  },

  stopText: {
    marginLeft: 10,
    fontSize: 14,
    fontWeight: '600',
  },

  noServiceContainer: {
    alignItems: 'center',
    marginTop: 40,
  },

  noBusTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
  },

  noBusSub: {
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
});