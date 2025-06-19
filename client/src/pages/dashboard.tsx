import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { registerDidSchema, issueVcSchema, verifyVcSchema } from "@shared/schema";
import { Copy, Fingerprint, Search, Award, Shield, CheckCircle, IdCard, Tag, Key } from "lucide-react";
import { copyToClipboard, formatDid, formatTimestamp } from "@/lib/utils";

export default function Dashboard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Stats query
  const { data: stats } = useQuery({
    queryKey: ["/api/stats"],
  });

  // Forms
  const registerForm = useForm({
    resolver: zodResolver(registerDidSchema),
    defaultValues: {
      keyType: "ed25519",
      method: "did:key",
    },
  });

  const [resolveDid, setResolveDid] = useState("");
  const [resolveResult, setResolveResult] = useState<any>(null);

  const issueForm = useForm({
    resolver: zodResolver(issueVcSchema.extend({
      claims: z.string().min(1, "Claims JSON is required"),
    })),
    defaultValues: {
      subjectDid: "",
      credentialType: "VerifiableCredential",
      claims: "",
    },
  });

  const verifyForm = useForm({
    resolver: zodResolver(verifyVcSchema.extend({
      credential: z.string().min(1, "Credential JSON is required"),
    })),
    defaultValues: {
      credential: "",
    },
  });

  // Mutations
  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/register", data);
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "DID Registered Successfully",
        description: `New DID: ${formatDid(data.did)}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Registration Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (did: string) => {
      const res = await apiRequest("GET", `/api/resolve/${encodeURIComponent(did)}`);
      return res.json();
    },
    onSuccess: (data) => {
      setResolveResult(data);
      toast({
        title: "DID Resolved Successfully",
        description: "DID document retrieved",
      });
    },
    onError: (error) => {
      setResolveResult(null);
      toast({
        title: "Resolution Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const issueMutation = useMutation({
    mutationFn: async (data: any) => {
      let claims;
      try {
        claims = JSON.parse(data.claims);
      } catch {
        throw new Error("Invalid JSON in claims field");
      }

      const res = await apiRequest("POST", "/api/issue-vc", {
        ...data,
        claims,
      });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "Credential Issued Successfully",
        description: `VC ID: ${data.vcId}`,
      });
    },
    onError: (error) => {
      toast({
        title: "Issuance Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const verifyMutation = useMutation({
    mutationFn: async (data: any) => {
      let credential;
      try {
        credential = JSON.parse(data.credential);
      } catch {
        throw new Error("Invalid JSON in credential field");
      }

      const res = await apiRequest("POST", "/api/verify-vc", { credential });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: data.verified ? "Credential Valid" : "Credential Invalid",
        description: data.verified ? "Signature and issuer verified" : (data.errors?.[0] || "Verification failed"),
        variant: data.verified ? "default" : "destructive",
      });
    },
    onError: (error) => {
      toast({
        title: "Verification Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCopy = async (text: string) => {
    try {
      await copyToClipboard(text);
      toast({
        title: "Copied to clipboard",
        description: "Text has been copied to your clipboard",
      });
    } catch {
      toast({
        title: "Copy failed",
        description: "Failed to copy text to clipboard",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="bg-primary p-2 rounded-lg">
                <Fingerprint className="text-white text-xl" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">DID Resolver</h1>
                <p className="text-sm text-gray-500">Decentralized Identity & Wallet</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Connected
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Dashboard Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-blue-100">
                  <IdCard className="text-blue-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total DIDs</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.totalDids || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-green-100">
                  <Tag className="text-green-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">VCs Issued</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.vcsIssued || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-purple-100">
                  <Shield className="text-purple-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Verified</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.verified || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-3 rounded-lg bg-orange-100">
                  <Key className="text-orange-600 text-xl" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Keys</p>
                  <p className="text-2xl font-bold text-gray-900">{stats?.activeKeys || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Functions Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* DID Registration */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Fingerprint className="text-blue-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Register New DID</CardTitle>
                  <p className="text-sm text-gray-600">Generate a new decentralized identifier</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...registerForm}>
                <form onSubmit={registerForm.handleSubmit((data) => registerMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={registerForm.control}
                    name="keyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Key Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="ed25519">Ed25519 (Recommended)</SelectItem>
                            <SelectItem value="secp256k1">secp256k1</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={registerForm.control}
                    name="method"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>DID Method</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="did:key">did:key</SelectItem>
                            <SelectItem value="did:web">did:web (Optional)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full" disabled={registerMutation.isPending}>
                    <Fingerprint className="mr-2 h-4 w-4" />
                    {registerMutation.isPending ? "Generating..." : "Generate DID"}
                  </Button>
                </form>
              </Form>

              {registerMutation.data && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Generated DID</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">DID</label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-sm font-mono bg-white p-2 rounded border text-gray-800">
                          {registerMutation.data.did}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(registerMutation.data.did)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Public Key</label>
                      <div className="flex items-center space-x-2">
                        <code className="flex-1 text-sm font-mono bg-white p-2 rounded border text-gray-800">
                          {registerMutation.data.publicKey}
                        </code>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(registerMutation.data.publicKey)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* DID Resolution */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Search className="text-green-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Resolve DID</CardTitle>
                  <p className="text-sm text-gray-600">Get DID Document for any identifier</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">DID to Resolve</label>
                  <Input
                    placeholder="did:key:z6MkrJVnaZkeFzdQyQSrw2WJGMJkAscQ8f..."
                    value={resolveDid}
                    onChange={(e) => setResolveDid(e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>
                <Button
                  className="w-full bg-green-500 hover:bg-green-600"
                  onClick={() => resolveMutation.mutate(resolveDid)}
                  disabled={!resolveDid || resolveMutation.isPending}
                >
                  <Search className="mr-2 h-4 w-4" />
                  {resolveMutation.isPending ? "Resolving..." : "Resolve DID"}
                </Button>
              </div>

              {resolveResult && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">DID Document</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(JSON.stringify(resolveResult.didDocument, null, 2))}
                    >
                      <Copy className="mr-1 h-3 w-3" />
                      Copy JSON
                    </Button>
                  </div>
                  <div className="bg-white rounded border p-3 text-xs font-mono text-gray-800 overflow-x-auto">
                    <pre>{JSON.stringify(resolveResult.didDocument, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Issue Verifiable Credential */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Award className="text-purple-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Issue Verifiable Credential</CardTitle>
                  <p className="text-sm text-gray-600">Create and sign a new credential</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...issueForm}>
                <form onSubmit={issueForm.handleSubmit((data) => issueMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={issueForm.control}
                    name="subjectDid"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject DID</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="did:key:z6MkrJVnaZkeFzdQyQSrw2WJGMJkAscQ8f..."
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={issueForm.control}
                    name="credentialType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Credential Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="VerifiableCredential">Basic Credential</SelectItem>
                            <SelectItem value="EducationCredential">Education Credential</SelectItem>
                            <SelectItem value="EmploymentCredential">Employment Credential</SelectItem>
                            <SelectItem value="IdentityCredential">Identity Credential</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={issueForm.control}
                    name="claims"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Claims (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder='{"name": "John Doe", "degree": "Computer Science"}'
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-purple-500 hover:bg-purple-600" disabled={issueMutation.isPending}>
                    <Tag className="mr-2 h-4 w-4" />
                    {issueMutation.isPending ? "Issuing..." : "Issue Credential"}
                  </Button>
                </form>
              </Form>

              {issueMutation.data && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Issued Verifiable Credential</h3>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      <CheckCircle className="mr-1 h-3 w-3" />
                      Signed
                    </span>
                  </div>
                  <div className="bg-white rounded border p-3 text-xs font-mono text-gray-800 overflow-x-auto max-h-48 overflow-y-auto">
                    <pre>{JSON.stringify(issueMutation.data.credential, null, 2)}</pre>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Verify Verifiable Credential */}
          <Card>
            <CardHeader className="border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Shield className="text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-lg font-semibold text-gray-900">Verify Credential</CardTitle>
                  <p className="text-sm text-gray-600">Validate signature and issuer</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <Form {...verifyForm}>
                <form onSubmit={verifyForm.handleSubmit((data) => verifyMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={verifyForm.control}
                    name="credential"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Verifiable Credential (JSON)</FormLabel>
                        <FormControl>
                          <Textarea
                            rows={8}
                            placeholder="Paste the complete VC JSON here..."
                            className="font-mono text-sm"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={verifyMutation.isPending}>
                    <Shield className="mr-2 h-4 w-4" />
                    {verifyMutation.isPending ? "Verifying..." : "Verify Credential"}
                  </Button>
                </form>
              </Form>

              {verifyMutation.data && (
                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-medium text-gray-900">Verification Result</h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      verifyMutation.data.verified 
                        ? "bg-green-100 text-green-800" 
                        : "bg-red-100 text-red-800"
                    }`}>
                      <CheckCircle className="mr-1 h-3 w-3" />
                      {verifyMutation.data.verified ? "Valid" : "Invalid"}
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Issuer:</span>
                        <p className="font-mono text-xs text-gray-800 break-all">{verifyMutation.data.issuer}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Subject:</span>
                        <p className="font-mono text-xs text-gray-800 break-all">{verifyMutation.data.subject}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Issued:</span>
                        <p className="text-xs text-gray-800">{formatTimestamp(verifyMutation.data.issuanceDate)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Signature:</span>
                        <p className={`text-xs ${verifyMutation.data.verified ? "text-green-600" : "text-red-600"}`}>
                          {verifyMutation.data.verified ? "✓ Valid" : "✗ Invalid"}
                        </p>
                      </div>
                    </div>
                    {verifyMutation.data.errors && (
                      <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
                        <p className="text-xs text-red-600">{verifyMutation.data.errors.join(", ")}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
