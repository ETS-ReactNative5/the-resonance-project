// @flow

import React from 'react';
import {
  Image,
  StatusBar,
  ScrollView,
  StyleSheet,
  FlatList,
  Text,
  View,
  Dimensions,
} from 'react-native';
import Colors from '../constants/Colors';
import { getSomething } from '../data/wordpress';
import { BlurView } from 'expo-blur';

export default class HomeScreen extends React.Component {
  state: {
    cardData: Object,
  };

  static navigationOptions = {
    header: null,
  };

  componentDidMount = async () => {
    const data = await getSomething();

    this.setState({ cardData: data });
  };

  render() {
    const screenWidth = Dimensions.get('window').width;
    const statusBarHeight = 40;
    return (
      <View style={styles.container}>
        <StatusBar
          backgroundColor="blue"
          translucent
          barStyle="light-content"
        />
        <BlurView
          style={{
            width: screenWidth,
            height: statusBarHeight,
          }}
          tint="dark"
          intensity={100}
        />
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.contentContainer}
        >
          <View style={styles.welcomeContainer}>
            <Image
              source={require('../assets/images/echo_logo.png')}
              style={styles.welcomeImage}
            />
          </View>
          <FlatList
            keyExtractor={({ title }) => title}
            data={this.state.cardData}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
            renderItem={({ item }) => {
              return (
                <View style={{ alignItems: 'center' }}>
                  <Card data={item} />
                </View>
              );
            }}
            style={styles.list}
          />
        </ScrollView>
      </View>
    );
  }
}

class Card extends React.Component {
  state = {
    numBodyLines: 3,
  };

  onLayout(event) {
    const screenWidth = Dimensions.get('window').width;
    const cardHeight = screenWidth - 16;
    const { x, y, height, width } = event.nativeEvent.layout;
    console.log(`screenWidth = ${screenWidth}, height = ${height}`);
    if (height > cardHeight / 2) {
      this.setState({ numBodyLines: 2 });
    }
  }

  render() {
    const screenWidth = Dimensions.get('window').width;
    const icon = {
      BLOG: require('../assets/icons/Blog.png'),
      'MESSAGE SERIES': require('../assets/icons/Message.png'),
      EVENTS: require('../assets/icons/Events.png'),
      ANNOUNCEMENT: require('../assets/icons/Announcements.png'),
    }[this.props.data.type];
    return (
      <View
        style={{
          width: screenWidth - 16,
          height: screenWidth - 16,
          backgroundColor: Colors.darkGray,
          borderRadius: 8,
          overflow: 'hidden',
        }}
      >
        <Image
          source={this.props.data.image}
          style={{
            width: screenWidth - 16,
            height: (screenWidth - 16) / 2,
          }}
        />
        <View onLayout={event => this.onLayout(event)}>
          <View style={styles.cardTypeView}>
            <Image source={icon} style={styles.cardTypeIcon} />
            <Text style={styles.cardTypeText}>{this.props.data.type}</Text>
          </View>
          <Text style={styles.cardTitleText} numberOfLines={2}>
            {this.props.data.title}
          </Text>
          <Text style={styles.cardSubtitleText}>
            {`${this.props.data.author} | ${formatDate(this.props.data.date)}`}
          </Text>
          <Text
            style={styles.cardBodyText}
            numberOfLines={this.state.numBodyLines}
          >
            {this.props.data.body}
          </Text>
        </View>
      </View>
    );
  }
}

const formatDate = date => {
  return date.toLocaleString('en-us', {
    month: 'long',
    year: 'numeric',
    day: 'numeric',
  });
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkestGray,
  },
  statusBar: {
    height: 100,
    width: 100,
    backgroundColor: '#ffffff',
  },
  contentContainer: {
    paddingTop: 30,
  },
  welcomeContainer: {
    alignItems: 'center',
    marginTop: 0,
    marginBottom: 10,
  },
  welcomeImage: {
    width: 300,
    resizeMode: 'contain',
  },
  cardContainer: {
    width: 100,
    height: 80,
    backgroundColor: 'red',
    borderRadius: 10,
  },
  cardTitleText: {
    fontSize: 20,
    textAlign: 'left',
    fontFamily: 'AvenirNext-Medium',
    paddingLeft: 8,
    paddingTop: 8,
    color: Colors.white,
  },
  cardSubtitleText: {
    fontSize: 14,
    textAlign: 'left',
    fontFamily: 'AvenirNext-Regular',
    paddingLeft: 8,
    paddingTop: 8,
    color: Colors.white,
  },
  cardTypeIcon: {
    width: 16,
    height: 16,
  },
  cardTypeText: {
    fontSize: 13,
    textAlign: 'left',
    fontFamily: 'AvenirNext-Bold',
    paddingLeft: 8,
    color: Colors.white,
  },
  cardTypeView: {
    paddingTop: 16,
    paddingLeft: 8,
    paddingRight: 16,
    flexDirection: 'row',
  },
  cardBodyText: {
    fontSize: 14,
    textAlign: 'left',
    paddingLeft: 8,
    paddingTop: 8,
    paddingRight: 8,
    color: Colors.white,
  },
  separator: {
    height: 16,
  },
});
