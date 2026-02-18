import React from "react";
import { Box, Flex, Typography, Button, IconButton, Alert, Divider } from "@strapi/design-system";
import { Eye, ArrowsCounterClockwise } from "@strapi/icons";
import { useIntl } from "react-intl";
import { useNotification, Widget } from "@strapi/strapi/admin";
import axios from "axios";
import { pluginName } from "../pluginId";
import { getTranslation } from "../utils/getTranslation";
import { StatRow } from "./StatRow";

interface GenTypesStats {
  lastGenerated?: string;
  status: "success" | "error" | "never-run";
  totalTypes: number;
  apiTypes: number;
  componentTypes: number;
  outputLocation: string;
  singleFile: boolean;
  errorMessage?: string;
  hasFilters: boolean;
  hasExtendedTypes: boolean;
  isProduction: boolean;
}

export const GenTypesWidget = () => {
  const { formatMessage } = useIntl();
  const { toggleNotification } = useNotification();
  const [stats, setStats] = React.useState<GenTypesStats | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [regenerating, setRegenerating] = React.useState(false);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get(`/${pluginName}/stats`);
      setStats(data);
    } catch (error) {
      console.error("Failed to fetch gen-types stats:", error);
      toggleNotification({
        type: "danger",
        message: formatMessage({
          id: getTranslation("widget.error.fetch"),
          defaultMessage: "Failed to fetch generation stats",
        }),
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      await axios.post(`/${pluginName}/regenerate`);
      toggleNotification({
        type: "success",
        message: formatMessage({
          id: getTranslation("widget.regenerate.success"),
          defaultMessage: "Types regenerated successfully",
        }),
      });
      await fetchStats();
    } catch (error: any) {
      toggleNotification({
        type: "danger",
        message:
          error?.response?.data?.error?.message ||
          formatMessage({
            id: getTranslation("widget.regenerate.error"),
            defaultMessage: "Failed to regenerate types",
          }),
      });
    } finally {
      setRegenerating(false);
    }
  };

  React.useEffect(() => {
    fetchStats();
  }, []);

  if (loading || !stats) {
    return <Widget.Loading />;
  }

  const getStatusColor = () => {
    if (stats.isProduction) return "warning";
    if (stats.status === "error") return "danger";
    if (stats.status === "success") return "success";
    return "neutral";
  };

  const getStatusText = () => {
    if (stats.isProduction) return "Disabled in production";
    if (stats.status === "error") return "Generation failed";
    if (stats.status === "never-run") return "Not yet generated";
    return "Up to date";
  };

  const getRelativeTime = (timestamp?: string) => {
    if (!timestamp) return "Never";
    const now = new Date();
    const then = new Date(timestamp);
    const diffMs = now.getTime() - then.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    if (diffMins > 0) return `${diffMins}m ago`;
    return "Just now";
  };

  return (
    <div>
      <Flex justifyContent="space-between" alignItems="center" style={{ marginBottom: 16 }}>
        <Typography variant="delta">
          {formatMessage({
            id: getTranslation("widget.title"),
            defaultMessage: "Generated Types",
          })}
        </Typography>
        <Flex gap={1}>
          <IconButton
            onClick={fetchStats}
            label={formatMessage({
              id: getTranslation("widget.refresh"),
              defaultMessage: "Refresh",
            })}
            disabled={loading}
          >
            <ArrowsCounterClockwise />
          </IconButton>
          <IconButton
            onClick={() => (window.location.href = `/admin/plugins/${pluginName}`)}
            label={formatMessage({
              id: getTranslation("widget.view"),
              defaultMessage: "View Types",
            })}
          >
            <Eye />
          </IconButton>
        </Flex>
      </Flex>

      {stats.isProduction && (
        <Alert variant="warning" style={{ marginBottom: 16 }}>
          {formatMessage({
            id: getTranslation("widget.production.warning"),
            defaultMessage: "Type generation is disabled in production mode",
          })}
        </Alert>
      )}

      {stats.status === "error" && stats.errorMessage && (
        <Alert variant="danger" title="Generation Error" style={{ marginBottom: 16 }}>
          {stats.errorMessage}
        </Alert>
      )}

      <Flex direction="column" gap={2}>
        <StatRow label="Status" value={getStatusText()} valueColor={`${getStatusColor()}700`} />
        <StatRow label="Last Generated" value={getRelativeTime(stats.lastGenerated)} />

        <StatRow
          label="Types Count"
          value={`${stats.totalTypes} (${stats.apiTypes} APIs • ${stats.componentTypes} Components)`}
        />

        <StatRow label="Output" value={stats.outputLocation} />
        {stats.hasFilters && (
          <>
            <StatRow label="Filters" value="Active" valueColor="primary600" />
          </>
        )}
        {stats.hasExtendedTypes && (
          <>
            <StatRow label="Extended Types" value="Yes" valueColor="primary600" />
          </>
        )}
      </Flex>
      {/* Regenerate types */}
      <Box style={{ marginTop: 24 }}>
        <Button onClick={handleRegenerate} disabled={regenerating || stats.isProduction}>
          {formatMessage({
            id: getTranslation("widget.regenerate"),
            defaultMessage: "Regenerate Types",
          })}
        </Button>
      </Box>
    </div>
  );
};
