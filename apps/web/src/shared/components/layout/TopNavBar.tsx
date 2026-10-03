import React from 'react';
import { Header, HeaderProps } from '../../../widgets/header';

export type TopNavBarProps = HeaderProps;

/**
 * @deprecated Header 위젯(`src/widgets/header`)을 직접 사용하세요.
 */
export const TopNavBar: React.FC<TopNavBarProps> = (props) => {
  return <Header {...props} />;
};

export default TopNavBar;
