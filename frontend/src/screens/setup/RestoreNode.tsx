import { ChangeEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import TwoColumnLayoutHeader from "src/components/TwoColumnLayoutHeader";
import { Input } from "src/components/ui/input";
import { Label } from "src/components/ui/label";
import { LoadingButton } from "src/components/ui/loading-button";
import { useToast } from "src/components/ui/use-toast";
import { useCSRF } from "src/hooks/useCSRF";
import { handleRequestError } from "src/utils/handleRequestError";
import { request } from "src/utils/request";

export function RestoreNode() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: csrf } = useCSRF();
  const [unlockPassword, setUnlockPassword] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csrf) {
      throw new Error("No CSRF token");
    }

    const formData = new FormData();
    formData.append("unlockPassword", unlockPassword);
    if (file !== null) {
      formData.append("backup", file);
    }

    try {
      setLoading(true);
      await request("/api/restore", {
        method: "POST",
        headers: {
          "X-CSRF-Token": csrf,
        },
        body: formData,
      });

      navigate("/setup/finish");
      toast({ title: "Backup restored successfully!" });
    } catch (error) {
      handleRequestError(toast, "Failed to restore backup", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeFile = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files) setFile(files[0]);
  };

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="flex flex-col gap-5 mx-auto max-w-2xl text-sm"
      >
        <TwoColumnLayoutHeader
          title="Restore Node Backup"
          description="Restore a previously created backup to recover your node."
        />
        <div className="grid gap-2">
          <Label htmlFor="password">Unlock Password</Label>
          <Input
            type="password"
            name="password"
            required
            onChange={(e) => setUnlockPassword(e.target.value)}
            value={unlockPassword}
            placeholder="Unlock Password"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="backup">Backup File</Label>
          <Input
            type="file"
            required
            name="backup"
            accept=".zip"
            onChange={handleChangeFile}
          />
        </div>
        <LoadingButton loading={loading}>Restore Node</LoadingButton>
      </form>
    </>
  );
}
