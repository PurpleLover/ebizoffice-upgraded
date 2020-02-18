import React, { Component } from 'react';
import { View, Text, TouchableOpacity, FlatList, ScrollView } from 'react-native';

import {
  Container, Header, Left, Button,
  Body, Icon, Title, Content, Form,
  Tabs, Tab, TabHeading, ScrollableTab, Right, Subtitle
} from 'native-base';

import {
  Icon as RneIcon, ButtonGroup, List, ListItem,
} from 'react-native-elements';

import { connect } from 'react-redux';

import { Colors, API_URL, EMPTY_STRING } from '../../../common/SystemConstant';
import { moderateScale } from '../../../assets/styles/ScaleIndicator';
import { NativeBaseStyle } from '../../../assets/styles/NativeBaseStyle';
import { appGetDataAndNavigate, _readableFormat, convertDateToString } from '../../../common/Utilities';
import { dataLoading } from '../../../common/Effect';
import { GoBackButton } from '../../common';
import { GridPanelStyle } from '../../../assets/styles/GridPanelStyle';
import { SideBarStyle } from '../../../assets/styles/SideBarStyle';
import { ButtonGroupStyle } from '../../../assets/styles/ButtonGroupStyle';
import * as navAction from '../../../redux/modules/Nav/Action';
import { MenuProvider, Menu, MenuTrigger, MenuOptions, MenuOption } from 'react-native-popup-menu';
import { HeaderMenuStyle } from '../../../assets/styles';
import { lichtrucApi } from '../../../common/Api';
import { InfoStyle } from '../../../assets/styles';

class DetailLichtruc extends Component {
  constructor(props) {
    super(props);

    this.state = {
      id: props.extendsNavParams.listIds ? props.extendsNavParams.listIds.pop() : props.coreNavParams.id,
      userId: this.props.userInfo.ID,
      userFullname: props.userInfo.Fullname || "Người dùng",
      data: [],
      loading: false,
    }
  }

  fetchData = async () => {
    this.setState({
      loading: true
    })

    const {
      id, userId
    } = this.state;

    const result = await lichtrucApi().getDetail([
      id,
      userId
    ]);

    this.setState({
      loading: false,
      data: result || null
    })
  }

  componentWillMount = () => {
    this.fetchData();
  }

  navigateBack = () => {
    this.props.navigation.goBack();
  }

  onNavigateToScreen = (screenParams, screenName) => {
    const navObj = this.props.navigation || this.props.navigator;
    this.props.updateCoreNavParams(screenParams);
    navObj.navigate(screenName);
  }

  render() {
    const { data, userFullname, loading } = this.state;

    let bodyContent = null;
    if (loading) {
      bodyContent = dataLoading(loading);
    }
    else {
      if (!!data && data.length > 0) {
        const listDate = data.map(x => `- ${x}`).join(`\n`);
        bodyContent = (
          <View style={InfoStyle.container}>
            <ScrollView>
              <List containerStyle={InfoStyle.listContainer}>
                {
                  data.map(x => (
                    <ListItem style={InfoStyle.listItemContainer}
                      hideChevron
                      title={
                        <Text style={InfoStyle.listItemTitleContainer}>
                          {x}
                        </Text>
                      }
                    />
                  ))
                }
              </List>
            </ScrollView>
          </View>
        );
        // bodyContent = (
        //   <View style={GridPanelStyle.container}>
        //     <View style={GridPanelStyle.titleContainer}>
        //       <Text style={[GridPanelStyle.listItemTitle, { color: Colors.DANK_GRAY, fontSize: moderateScale(11, 0.9) }]}>Thời gian</Text>
        //     </View>
        //     <View style={{ marginTop: "0.5%" }}>
        //       <Text style={{ fontSize: moderateScale(12, 1.2) }}>{listDate}</Text>
        //     </View>
        //   </View>
        // );
      }
      else {
        bodyContent = (
          <View style={GridPanelStyle.container}>
            <View style={GridPanelStyle.titleContainer}>
              <Text style={[GridPanelStyle.listItemTitle, { color: Colors.RED_PANTONE_186C, fontSize: moderateScale(11, 0.9) }]}>Không tìm thấy!</Text>
            </View>
            <View style={{ marginTop: "0.5%" }}>
              <Text style={{ fontSize: moderateScale(12, 1.2), fontStyle: "italic" }}>Bạn không có trong danh sách xếp lịch này!</Text>
            </View>
          </View>
        );
      }
    }

    return (
      <Container style={{ backgroundColor: '#f1f1f1' }}>
        <Header style={NativeBaseStyle.container}>
          <Left style={NativeBaseStyle.left}>
            <GoBackButton onPress={() => this.navigateBack()} />
          </Left>

          <Body style={NativeBaseStyle.body}>
            <Title style={NativeBaseStyle.bodyTitle}>
              CHI TIẾT LỊCH TRỰC
            </Title>
            <Subtitle style={NativeBaseStyle.bodyTitle}>
              {userFullname.toUpperCase()}
            </Subtitle>
          </Body>

          <Right style={NativeBaseStyle.right} />
        </Header>

        <Content contentContainerStyle={{ flex: 1, backgroundColor: '#f1f1f1', paddingVertical: moderateScale(6, 1.2) }} scrollEnabled>
          {bodyContent}
        </Content>
      </Container>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    extendsNavParams: state.navState.extendsNavParams,
    coreNavParams: state.navState.coreNavParams,
    userInfo: state.userState.userInfo,
  }
}

export default connect(mapStateToProps, null)(DetailLichtruc);