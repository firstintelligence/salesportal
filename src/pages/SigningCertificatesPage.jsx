import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, FileText, User, Calendar, Globe, ArrowLeft, Search, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

// Admin agents who can access this page
const SUPER_ADMINS = ['MM23'];

const SigningCertificatesPage = () => {
  const navigate = useNavigate();
  const [signatures, setSignatures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSignature, setSelectedSignature] = useState(null);
  
  // Check admin access
  const agentId = localStorage.getItem('agentId');
  const isAdmin = SUPER_ADMINS.includes(agentId);

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. Super admin privileges required.');
      navigate('/dashboard');
      return;
    }
    
    fetchSignatures();
  }, [isAdmin, navigate]);

  const fetchSignatures = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('document_signatures')
        .select('*')
        .order('signed_at', { ascending: false });
      
      if (error) throw error;
      setSignatures(data || []);
    } catch (error) {
      console.error('Error fetching signatures:', error);
      toast.error('Failed to load signing certificates');
    } finally {
      setLoading(false);
    }
  };

  const filteredSignatures = signatures.filter(sig => {
    const search = searchTerm.toLowerCase();
    return (
      (sig.customer_name || '').toLowerCase().includes(search) ||
      (sig.city || '').toLowerCase().includes(search) ||
      (sig.region || '').toLowerCase().includes(search) ||
      (sig.agent_id || '').toLowerCase().includes(search) ||
      (sig.document_type || '').toLowerCase().includes(search)
    );
  });

  // Format location in Canadian format: Address, City, Province (2 letters) XXX XXX
  const formatLocationCanadian = (sig) => {
    const parts = [];
    if (sig.city) parts.push(sig.city);
    if (sig.region) {
      const province = sig.region.length <= 2 
        ? sig.region.toUpperCase() 
        : sig.region.substring(0, 2).toUpperCase();
      parts.push(province);
    }
    if (sig.postal_code) {
      const pc = sig.postal_code.replace(/\s/g, '').toUpperCase();
      const formattedPC = pc.length === 6 ? `${pc.substring(0, 3)} ${pc.substring(3)}` : pc;
      parts.push(formattedPC);
    }
    return parts.length > 0 ? parts.join(', ') : 'Location unavailable';
  };

  const openGoogleMaps = (lat, lng) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    }
  };

  if (!isAdmin) {
    return null;
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading signing certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Signing Certificates</h1>
          <p className="text-muted-foreground">View document signing locations and verification data</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer, city, agent..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{signatures.length}</div>
            <p className="text-sm text-muted-foreground">Total Signatures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {signatures.filter(s => s.signature_type === 'customer').length}
            </div>
            <p className="text-sm text-muted-foreground">Customer Signatures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {signatures.filter(s => s.signature_type === 'co_applicant').length}
            </div>
            <p className="text-sm text-muted-foreground">Co-Applicant Signatures</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {new Set(signatures.map(s => s.agent_id)).size}
            </div>
            <p className="text-sm text-muted-foreground">Unique Agents</p>
          </CardContent>
        </Card>
      </div>

      {/* Signatures List */}
      <div className="grid gap-4">
        {filteredSignatures.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No signing certificates found</p>
            </CardContent>
          </Card>
        ) : (
          filteredSignatures.map((sig) => (
            <Card 
              key={sig.id} 
              className={`cursor-pointer transition-all hover:shadow-md ${selectedSignature?.id === sig.id ? 'ring-2 ring-primary' : ''}`}
              onClick={() => setSelectedSignature(selectedSignature?.id === sig.id ? null : sig)}
            >
              <CardContent className="pt-4">
                <div className="flex flex-col md:flex-row md:items-start gap-4">
                  {/* Main Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold truncate">{sig.customer_name || 'Unknown'}</span>
                      <Badge variant={sig.signature_type === 'customer' ? 'default' : 'secondary'}>
                        {sig.signature_type === 'co_applicant' ? 'Co-Applicant' : 'Customer'}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(sig.signed_at), 'MMM dd, yyyy HH:mm')}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <FileText className="h-3 w-3" />
                      {sig.document_type || 'Document'} • Agent: {sig.agent_id}
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-3 w-3 text-primary" />
                      <span className="font-medium">{formatLocationCanadian(sig)}</span>
                      {sig.latitude && sig.longitude && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-6 px-2"
                          onClick={(e) => {
                            e.stopPropagation();
                            openGoogleMaps(sig.latitude, sig.longitude);
                          }}
                        >
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Map
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Coordinates Badge */}
                  {sig.latitude && sig.longitude && (
                    <div className="flex-shrink-0">
                      <Badge variant="outline" className="font-mono text-xs">
                        {sig.latitude.toFixed(4)}, {sig.longitude.toFixed(4)}
                      </Badge>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {selectedSignature?.id === sig.id && (
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-semibold mb-3">Signing Certificate Details</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Location Details */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Location Information</h5>
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                          <div><span className="text-muted-foreground">City:</span> {sig.city || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Region/Province:</span> {sig.region || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Country:</span> {sig.country || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Postal Code:</span> {sig.postal_code || 'N/A'}</div>
                          <div><span className="text-muted-foreground">Timezone:</span> {sig.timezone || 'N/A'}</div>
                          {sig.latitude && sig.longitude && (
                            <div><span className="text-muted-foreground">Coordinates:</span> {sig.latitude.toFixed(6)}, {sig.longitude.toFixed(6)}</div>
                          )}
                        </div>
                      </div>

                      {/* Technical Details */}
                      <div className="space-y-2">
                        <h5 className="text-sm font-medium text-muted-foreground">Technical Information</h5>
                        <div className="bg-muted/50 rounded-lg p-3 space-y-1 text-sm">
                          <div><span className="text-muted-foreground">IP Address:</span> {sig.ip_address || 'N/A'}</div>
                          <div><span className="text-muted-foreground">ISP:</span> {sig.isp || 'N/A'}</div>
                          <div className="break-all">
                            <span className="text-muted-foreground">User Agent:</span> 
                            <span className="text-xs"> {sig.user_agent || 'N/A'}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Map Embed */}
                    {sig.latitude && sig.longitude && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-muted-foreground mb-2">Signing Location Map</h5>
                        <div className="relative rounded-lg overflow-hidden bg-muted h-[200px]">
                          <iframe
                            title="Signing Location"
                            width="100%"
                            height="200"
                            frameBorder="0"
                            style={{ border: 0 }}
                            src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${sig.latitude},${sig.longitude}&zoom=15`}
                            allowFullScreen
                          />
                        </div>
                        <div className="flex justify-end mt-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openGoogleMaps(sig.latitude, sig.longitude)}
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            Open in Google Maps
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Document Link */}
                    {sig.document_url && (
                      <div className="mt-4">
                        <Button 
                          variant="outline"
                          onClick={() => window.open(sig.document_url, '_blank')}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          View Signed Document
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default SigningCertificatesPage;