/**
 * @description: màn hình trình xử lý văn bản
 * @author: duynn
 * @since: 16/05/2018
 */
'use strict'
import React, { Component } from 'react';

//utilites
import {
  EMPTY_STRING,
  Colors,
  TOAST_DURATION_TIMEOUT
} from '../../../common/SystemConstant';

//effect
import { executeLoading } from '../../../common/Effect';

//redux
import { connect } from 'react-redux';
import * as navAction from '../../../redux/modules/Nav/Action';

//lib
import {
  Container, Header, Left, Content, Title,
  Form, Textarea, Body, Right, Toast
} from 'native-base';

import { NativeBaseStyle } from '../../../assets/styles/NativeBaseStyle';

//views
import { tripApi } from '../../../common/Api';
import { HeaderRightButton, GoBackButton } from '../../common';

class ReturnTrip extends Component {
  constructor(props) {
    super(props);
    this.state = {
      userId: props.userInfo.ID,
      tripId: this.props.extendsNavParams.tripId,
      ghichu: EMPTY_STRING,

      executing: false,
    }
  }

  navigateBack = () => {
    this.props.navigation.goBack();
  }

  saveReturn = async () => {
    const {
      tripId, ghichu, userId
    } = this.state;

    this.setState({
      executing: true
    });

    const resultJson = await tripApi().returnTrip({
      userId,
      tripId,
      ghichu
    });

    this.setState({
      executing: false
    })

    Toast.show({
      text: 'Trả xe ' + resultJson.Status ? 'thành công' : 'thất bại',
      type: resultJson.Status ? 'success' : 'danger',
      buttonText: "OK",
      buttonStyle: { backgroundColor: Colors.WHITE },
      buttonTextStyle: { color: resultJson.Status ? Colors.GREEN_PANTONE_364C : Colors.RED_PANTONE_186C },
      duration: TOAST_DURATION_TIMEOUT,
      onClose: () => {
        if (resultJson.Status) {
          this.props.updateExtendsNavParams({ check: true });
          this.navigateBack();
        }
      }
    });
  }

  render() {
    return (
      <Container>
        <Header hasTabs style={NativeBaseStyle.container}>
          <Left style={NativeBaseStyle.left}>
            <GoBackButton onPress={() => this.navigateBack()} />
          </Left>

          <Body style={[NativeBaseStyle.body, { flex: 5 }]}>
            <Title style={NativeBaseStyle.bodyTitle}>
              TRẢ XE
            </Title>
          </Body>

          <Right style={NativeBaseStyle.right}>
            <HeaderRightButton onPress={() => this.saveReturn()} />
          </Right>
        </Header>

        <Content contentContainerStyle={{ padding: 10 }}>
          <Form>
            <Textarea rowSpan={5} bordered placeholder='Ghi chú' onChangeText={(ghichu) => this.setState({ ghichu })} />
          </Form>
        </Content>
        {
          executeLoading(this.state.executing)
        }
      </Container>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    userInfo: state.userState.userInfo,
    extendsNavParams: state.navState.extendsNavParams,
  }
}

const mapDispatchToProps = (dispatch) => {
  return {
    updateExtendsNavParams: (extendsNavParams) => dispatch(navAction.updateExtendsNavParams(extendsNavParams))
  }
}

export default connect(mapStateToProps, mapDispatchToProps)(ReturnTrip);