import { Title, TitleSizes } from '@patternfly/react-core';
import type { Providers } from 'api/providers';
import { ProviderType } from 'api/providers';
import { getProvidersQuery } from 'api/queries/providersQuery';
import type { Query } from 'api/queries/query';
import { parseQuery } from 'api/queries/query';
import { getUserAccessQuery } from 'api/queries/userAccessQuery';
import type { Report } from 'api/reports/report';
import { ResourcePathsType } from 'api/resources/resource';
import type { UserAccess } from 'api/userAccess';
import { UserAccessType } from 'api/userAccess';
import type { AxiosError } from 'axios';
import { ExportsLink } from 'components/drawers';
import messages from 'locales/messages';
import React from 'react';
import type { WrappedComponentProps } from 'react-intl';
import { injectIntl } from 'react-intl';
import { connect } from 'react-redux';
import { CostDistribution } from 'routes/components/costDistribution';
import { CostType } from 'routes/components/costType';
import { Currency } from 'routes/components/currency';
import { GroupBy } from 'routes/components/groupBy';
import { Perspective } from 'routes/components/perspective';
import { getIdKeyForGroupBy } from 'routes/utils/computedReport/getComputedExplorerReportItems';
import type { Filter } from 'routes/utils/filter';
import { filterProviders, hasCloudProvider } from 'routes/utils/providers';
import { getRouteForQuery } from 'routes/utils/query';
import { createMapStateToProps, FetchStatus } from 'store/common';
import { featureFlagsSelectors } from 'store/featureFlags';
import { providersQuery, providersSelectors } from 'store/providers';
import { userAccessQuery, userAccessSelectors } from 'store/userAccess';
import type { RouterComponentProps } from 'utils/router';
import { withRouter } from 'utils/router';
import {
  hasAwsAccess,
  hasAzureAccess,
  hasGcpAccess,
  hasIbmAccess,
  isAwsAvailable,
  isAzureAvailable,
  isGcpAvailable,
  isIbmAvailable,
  isOciAvailable,
  isOcpAvailable,
  isRhelAvailable,
} from 'utils/userAccess';

import { ExplorerFilter } from './explorerFilter';
import { styles } from './explorerHeader.styles';
import {
  baseQuery,
  getGroupByDefault,
  getGroupByOptions,
  getOrgReportPathsType,
  getResourcePathsType,
  getTagReportPathsType,
  PerspectiveType,
} from './explorerUtils';

interface ExplorerHeaderOwnProps extends RouterComponentProps, WrappedComponentProps {
  costDistribution?: string;
  costType?: string;
  currency?: string;
  groupBy?: string;
  onCostDistributionSelected(value: string);
  onCostTypeSelected(value: string);
  onCurrencySelected(value: string);
  onDatePickerSelected(startDate: Date, endDate: Date);
  onFilterAdded(filter: Filter);
  onFilterRemoved(filter: Filter);
  onGroupBySelected(value: string);
  onPerspectiveClicked(value: string);
  perspective: PerspectiveType;
  report: Report;
}

interface ExplorerHeaderStateProps {
  awsProviders?: Providers;
  azureProviders?: Providers;
  gcpProviders?: Providers;
  ibmProviders?: Providers;
  isDistributedOverhead?: boolean;
  isExportsFeatureEnabled?: boolean;
  isFinsightsFeatureEnabled?: boolean;
  isIbmFeatureEnabled?: boolean;
  ociProviders?: Providers;
  ocpProviders?: Providers;
  providers: Providers;
  providersError: AxiosError;
  providersFetchStatus: FetchStatus;
  providersQueryString: string;
  query: Query;
  rhelProviders?: Providers;
  userAccess: UserAccess;
  userAccessError: AxiosError;
  userAccessFetchStatus: FetchStatus;
  userAccessQueryString: string;
}

interface ExplorerHeaderState {
  currentPerspective?: string;
}

type ExplorerHeaderProps = ExplorerHeaderOwnProps & ExplorerHeaderStateProps;

class ExplorerHeaderBase extends React.Component<ExplorerHeaderProps, ExplorerHeaderState> {
  protected defaultState: ExplorerHeaderState = {
    // TBD...
  };
  public state: ExplorerHeaderState = { ...this.defaultState };

  public componentDidMount() {
    this.setState({
      currentPerspective: this.props.perspective,
    });
  }

  public componentDidUpdate(prevProps: ExplorerHeaderProps) {
    const { perspective } = this.props;

    if (prevProps.perspective !== perspective) {
      this.setState({
        currentPerspective: this.props.perspective,
      });
    }
  }

  private getPerspective = (isDisabled: boolean) => {
    const { isIbmFeatureEnabled } = this.props;
    const { currentPerspective } = this.state;

    const hasAws = this.isAwsAvailable();
    const hasAzure = this.isAzureAvailable();
    const hasOci = this.isOciAvailable();
    const hasGcp = this.isGcpAvailable();
    const hasIbm = this.isIbmAvailable();
    const hasOcp = this.isOcpAvailable();
    const hasRhel = this.isRhelAvailable();

    // Note: No need to test "OCP on cloud" here, since that requires at least one of the providers below
    if (!(hasAws || hasAzure || hasOci || hasGcp || hasIbm || hasOcp || hasRhel)) {
      return null;
    }

    return (
      <Perspective
        currentItem={currentPerspective}
        hasAws={hasAws}
        hasAwsOcp={this.isAwsOcpAvailable()}
        hasAzure={hasAzure}
        hasAzureOcp={this.isAzureOcpAvailable()}
        hasGcp={hasGcp}
        hasGcpOcp={this.isGcpOcpAvailable()}
        hasIbm={hasIbm}
        hasIbmOcp={this.isIbmOcpAvailable()}
        hasOci={hasOci}
        hasOcp={hasOcp}
        hasOcpCloud={this.isOcpCloudAvailable()}
        hasRhel={hasRhel}
        isDisabled={isDisabled}
        isIbmFeatureEnabled={isIbmFeatureEnabled}
        onSelected={this.handleOnPerspectiveSelected}
      />
    );
  };

  private handleOnPerspectiveSelected = (value: string) => {
    const { onPerspectiveClicked, query, router } = this.props;

    const newQuery = {
      ...JSON.parse(JSON.stringify(query)),
      exclude: undefined,
      filter_by: undefined,
      group_by: { [getGroupByDefault(value)]: '*' },
      order_by: undefined, // Clear sort
      perspective: value,
    };
    this.setState({ currentPerspective: value }, () => {
      if (onPerspectiveClicked) {
        onPerspectiveClicked(value);
      }
      router.navigate(getRouteForQuery(newQuery, router.location, true), { replace: true });
    });
  };

  private isAwsAvailable = () => {
    const { awsProviders, userAccess } = this.props;
    return isAwsAvailable(userAccess, awsProviders);
  };

  private isAwsOcpAvailable = () => {
    const { awsProviders, ocpProviders, userAccess } = this.props;
    return hasAwsAccess(userAccess) && hasCloudProvider(awsProviders, ocpProviders);
  };

  private isAzureAvailable = () => {
    const { azureProviders, userAccess } = this.props;
    return isAzureAvailable(userAccess, azureProviders);
  };

  private isAzureOcpAvailable = () => {
    const { azureProviders, ocpProviders, userAccess } = this.props;
    return hasAzureAccess(userAccess) && hasCloudProvider(azureProviders, ocpProviders);
  };

  private isGcpAvailable = () => {
    const { gcpProviders, userAccess } = this.props;
    return isGcpAvailable(userAccess, gcpProviders);
  };

  private isGcpOcpAvailable = () => {
    const { gcpProviders, ocpProviders, userAccess } = this.props;
    return hasGcpAccess(userAccess) && hasCloudProvider(gcpProviders, ocpProviders);
  };

  private isIbmAvailable = () => {
    const { ibmProviders, userAccess } = this.props;
    return isIbmAvailable(userAccess, ibmProviders);
  };

  private isIbmOcpAvailable = () => {
    const { ibmProviders, ocpProviders, userAccess } = this.props;
    return hasIbmAccess(userAccess) && hasCloudProvider(ibmProviders, ocpProviders);
  };

  private isOciAvailable = () => {
    const { ociProviders, userAccess } = this.props;
    return isOciAvailable(userAccess, ociProviders);
  };

  private isOcpAvailable = () => {
    const { ocpProviders, userAccess } = this.props;
    return isOcpAvailable(userAccess, ocpProviders);
  };

  private isOcpCloudAvailable = () => {
    const hasAwsOcp = this.isAwsOcpAvailable();
    const hasAzureOcp = this.isAzureOcpAvailable();
    const hasGcpOcp = this.isGcpOcpAvailable();
    const hasIbmOcp = this.isIbmOcpAvailable();

    return hasAwsOcp || hasAzureOcp || hasGcpOcp || hasIbmOcp;
  };

  private isRhelAvailable = () => {
    const { isFinsightsFeatureEnabled, rhelProviders, userAccess } = this.props;
    return isFinsightsFeatureEnabled && isRhelAvailable(userAccess, rhelProviders);
  };

  public render() {
    const {
      costDistribution,
      costType,
      currency,
      groupBy,
      intl,
      isExportsFeatureEnabled,
      onCostDistributionSelected,
      onCostTypeSelected,
      onCurrencySelected,
      onFilterAdded,
      onFilterRemoved,
      onGroupBySelected,
      perspective,
      providersFetchStatus,
      query,
      report,
    } = this.props;

    // Note: No need to test OCP on cloud here, since that requires at least one provider
    const noAwsProviders = !this.isAwsAvailable() && providersFetchStatus === FetchStatus.complete;
    const noAzureProviders = !this.isAzureAvailable() && providersFetchStatus === FetchStatus.complete;
    const noGcpProviders = !this.isGcpAvailable() && providersFetchStatus === FetchStatus.complete;
    const noIbmProviders = !this.isIbmAvailable() && providersFetchStatus === FetchStatus.complete;
    const noOcpProviders = !this.isOcpAvailable() && providersFetchStatus === FetchStatus.complete;
    const noRhelProviders = !this.isRhelAvailable() && providersFetchStatus === FetchStatus.complete;
    const noProviders =
      noAwsProviders && noAzureProviders && noGcpProviders && noIbmProviders && noOcpProviders && noRhelProviders;

    const groupByOptions = getGroupByOptions(perspective);
    const orgPathsType = getOrgReportPathsType(perspective);
    const resourcePathsType = getResourcePathsType(perspective);
    const tagPathsType = getTagReportPathsType(perspective);

    const showCostDistribution = costDistribution && report?.meta?.distributed_overhead === true;

    return (
      <header style={styles.header}>
        <div style={styles.headerContent}>
          <Title headingLevel="h1" style={styles.title} size={TitleSizes['2xl']}>
            {intl.formatMessage(messages.explorerTitle)}
          </Title>
          <div style={styles.headerContentRight}>
            <Currency currency={currency} onSelect={onCurrencySelected} />
            {isExportsFeatureEnabled && <ExportsLink />}
          </div>
        </div>
        <div style={styles.perspectiveContainer}>
          {this.getPerspective(noProviders)}
          <div style={styles.groupBy}>
            <GroupBy
              getIdKeyForGroupBy={getIdKeyForGroupBy}
              groupBy={groupBy}
              isDisabled={noProviders}
              onSelected={onGroupBySelected}
              options={groupByOptions}
              orgPathsType={orgPathsType}
              perspective={perspective}
              resourcePathsType={resourcePathsType}
              showCostCategories={
                resourcePathsType === ResourcePathsType.aws || resourcePathsType === ResourcePathsType.awsOcp
              }
              showOrgs={orgPathsType}
              showTags={tagPathsType}
              tagPathsType={tagPathsType}
            />
          </div>
          {showCostDistribution && (
            <div style={styles.costDistribution}>
              <CostDistribution costDistribution={costDistribution} onSelect={onCostDistributionSelected} />
            </div>
          )}
          {(perspective === PerspectiveType.aws || perspective === PerspectiveType.awsOcp) && (
            <div style={styles.costType}>
              <CostType costType={costType} onSelect={onCostTypeSelected} />
            </div>
          )}
        </div>
        <ExplorerFilter
          groupBy={groupBy}
          isDisabled={noProviders}
          onFilterAdded={onFilterAdded}
          onFilterRemoved={onFilterRemoved}
          perspective={perspective}
          query={query}
        />
      </header>
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const mapStateToProps = createMapStateToProps<ExplorerHeaderOwnProps, ExplorerHeaderStateProps>(
  (state, { perspective, router }) => {
    const queryFromRoute = parseQuery<Query>(router.location.search);

    const providersQueryString = getProvidersQuery(providersQuery);
    const providers = providersSelectors.selectProviders(state, ProviderType.all, providersQueryString);
    const providersError = providersSelectors.selectProvidersError(state, ProviderType.all, providersQueryString);
    const providersFetchStatus = providersSelectors.selectProvidersFetchStatus(
      state,
      ProviderType.all,
      providersQueryString
    );

    const userAccessQueryString = getUserAccessQuery(userAccessQuery);
    const userAccess = userAccessSelectors.selectUserAccess(state, UserAccessType.all, userAccessQueryString);
    const userAccessError = userAccessSelectors.selectUserAccessError(state, UserAccessType.all, userAccessQueryString);
    const userAccessFetchStatus = userAccessSelectors.selectUserAccessFetchStatus(
      state,
      UserAccessType.all,
      userAccessQueryString
    );

    // Ensure group_by key is not undefined
    let group_by = queryFromRoute.group_by;
    if (!group_by && perspective) {
      group_by = { [getGroupByDefault(perspective)]: '*' };
    }

    const query: any = {
      ...baseQuery,
      ...queryFromRoute,
      group_by,
    };

    return {
      awsProviders: filterProviders(providers, ProviderType.aws),
      azureProviders: filterProviders(providers, ProviderType.azure),
      gcpProviders: filterProviders(providers, ProviderType.gcp),
      ibmProviders: filterProviders(providers, ProviderType.ibm),
      isExportsFeatureEnabled: featureFlagsSelectors.selectIsExportsFeatureEnabled(state),
      isFinsightsFeatureEnabled: featureFlagsSelectors.selectIsFinsightsFeatureEnabled(state),
      isIbmFeatureEnabled: featureFlagsSelectors.selectIsIbmFeatureEnabled(state),
      ociProviders: filterProviders(providers, ProviderType.oci),
      ocpProviders: filterProviders(providers, ProviderType.ocp),
      providers,
      providersError,
      providersFetchStatus,
      providersQueryString,
      query,
      rhelProviders: filterProviders(providers, ProviderType.rhel),
      userAccess,
      userAccessError,
      userAccessFetchStatus,
      userAccessQueryString,
    };
  }
);

const ExplorerHeader = injectIntl(withRouter(connect(mapStateToProps, {})(ExplorerHeaderBase)));

export { ExplorerHeader };
export type { ExplorerHeaderProps };
