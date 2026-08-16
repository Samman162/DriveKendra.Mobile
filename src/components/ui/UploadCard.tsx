import * as DocumentPicker from 'expo-document-picker';
import { CheckCircle2, Upload } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { uploadDocument } from '../../api/tusUpload';
import { colors } from '../../theme/colors';
import { radius, spacing } from '../../theme/spacing';

export type UploadState = {
  uploading: boolean;
  progress: number;
  fileName?: string;
  fileId?: string;
  error?: string;
};

type UploadCardProps = {
  title: string;
  subtitle: string;
  state: UploadState;
  onChange: (state: UploadState) => void;
};

export function UploadCard({ title, subtitle, state, onChange }: UploadCardProps) {
  const pickAndUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['image/jpeg', 'image/png', 'image/webp'],
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    const asset = result.assets[0];
    onChange({
      uploading: true,
      progress: 0,
      fileName: asset.name,
      error: undefined,
      fileId: undefined,
    });

    try {
      const fileId = await uploadDocument(
        {
          uri: asset.uri,
          name: asset.name,
          mimeType: asset.mimeType,
          size: asset.size,
        },
        (percent) => {
          onChange({
            uploading: true,
            progress: percent,
            fileName: asset.name,
          });
        },
      );

      onChange({
        uploading: false,
        progress: 100,
        fileName: asset.name,
        fileId,
      });
    } catch (error) {
      onChange({
        uploading: false,
        progress: 0,
        fileName: asset.name,
        error: error instanceof Error ? error.message : 'Upload failed.',
      });
    }
  };

  return (
    <Pressable onPress={pickAndUpload} style={styles.card}>
      <View style={styles.iconWrap}>
        {state.fileId ? (
          <CheckCircle2 color={colors.success} size={22} />
        ) : (
          <Upload color={colors.highlight} size={22} />
        )}
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{state.fileName || subtitle}</Text>
        {state.uploading ? (
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${state.progress}%` }]} />
          </View>
        ) : null}
        {state.fileId ? <Text style={styles.verified}>Verified upload</Text> : null}
        {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
      </View>
      <Text style={styles.action}>{state.fileId ? 'Replace' : 'Upload'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 14,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 2,
  },
  verified: {
    color: colors.success,
    fontSize: 12,
    marginTop: 4,
    fontWeight: '600',
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  action: {
    color: colors.highlight,
    fontWeight: '700',
    fontSize: 13,
  },
  progressTrack: {
    height: 6,
    backgroundColor: colors.elevated,
    borderRadius: 3,
    marginTop: spacing.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.highlight,
  },
});
