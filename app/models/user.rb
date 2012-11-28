class User < ActiveRecord::Base
  # Include default devise modules. Others available are:
  # :token_authenticatable, :confirmable,
  # :lockable, :timeoutable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :trackable, :validatable, :omniauthable

  # Setup accessible (or protected) attributes for your model
  attr_accessible :email, :password, :password_confirmation, :remember_me
  # attr_accessible :title, :body
  attr_accessible :provider, :uid, :name
  attr_accessible :token, :token_expiration

  after_save :broadcast_status

  def broadcast_status
    Message.publish(:status, {:uid => uid, :status => status})
  end

  # State information
  include AASM

  aasm :column => :status do
    state :offline, :initial => true
    state :online
    state :writing
    state :sent

    event :go_online do
      transitions :to => :online, :from => [:offline]
    end

    event :start_writing do
      transitions :to => :writing, :from => [:offline, :online, :writing]
    end

    event :send_message do
      transitions :to => :sent, :from => [:offline, :online, :writing, :sent]
    end

    event :refill_quota do
      transitions :to => :offline, :from => :sent
    end

    event :go_offline do
      transitions :to => :offline, :from => [:online]
    end
  end

  def self.reset_quotas!
    User.find_each do |u|
      u.refill_quota! if u.sent?
    end
  end

  def self.find_for_facebook_oauth(auth, signed_in_resource=nil)
    user = User.where(:provider => auth.provider, :uid => auth.uid).first
    if user
      user.token = auth.credentials.token
      user.save
    else
      user = User.create(name:auth.extra.raw_info.name,
                         provider:auth.provider,
                         uid:auth.uid,
                         email:auth.info.email,
                         password:Devise.friendly_token[0,20],
                         token: auth.credentials.token
                         )
    end
    user
  end

  def self.new_with_session(params, session)
    Rails.logger.info(session)
    super.tap do |user|
      if data = session["devise.facebook_data"]
        if session["devise.facebook_data"]["extra"]["raw_info"]
          user.email = data["email"] if user.email.blank?
        end
        if session['devise.facebook_data']["credentials"]
          user.token = session['devise.facebook_data']["credentials"]['token']
          user.token_expiration = Date.parse(session['devise.facebook_data']["credentials"]['expires_at'])
        end
      end
    end
  end

  def self.track_state

    jacob_observer = ChatStatusWatcher.new(Settings.kathryn_id, Settings.jacob_id)
    kathryn_observer = ChatStatusWatcher.new(Settings.jacob_id, Settings.kathryn_id)

    trap(:INT) { EM.stop }
    trap(:TERM) { EM.stop }
    EM.run do
      jacob_observer.run
      kathryn_observer.run
    end

=begin
    puts 'Loading...'

    uids = []
    uids << Settings.jacob_id
    uids << Settings.kathryn_id

    uids.each do |uid|
      Thread.new do
        user = User.where(uid: uid).first
        access_token = user.token
        user_jid =  Jabber::JID.new("-#{uid}@chat.facebook.com")

        client = Jabber::Client.new Jabber::JID.new("-#{uid}@chat.facebook.com")
        client.connect
        client.auth_sasl(Jabber::SASL::XFacebookPlatform.new(client, Settings.fb_id, access_token, Settings.fb_secret), nil)

        roster = Jabber::Roster::Helper.new(client)

        roster.add_presence_callback do |item, old_presence, presence|
          uids.each do |other_uid|
            if presence.from == Jabber::JID.new("-#{other_uid}@chat.facebook.com")
              puts "we got a valid presence notification"
              User.transaction do
                u = User.lock.where(uid: other_uid).first
                if presence.type == :unavailable and u.online?
                  u.go_offline!
                elsif u.offline?
                  u.go_online!
                end
              end
            end
          end
        end

        client.add_message_callback do |message|
          uids.each do |other_uid|
            if message.from == Jabber::JID.new("-#{other_uid}@chat.facebook.com")
              puts "we got a valid message notification"
              User.transaction do
                u = User.lock.where(uid: other_uid).first
                if message.composing?
                  u.start_writing
                elsif !message.body.nil?
                  u.send_message
                end
                u.save
              end
            end
          end
        end

        client.send(Jabber::Presence.new)

        Signal.trap("INT") do
          puts "Got interrupt - closing XMPP connection"
          client.close
          Thread.exit
        end

        while 1
          sleep 1
        end
      end
    end

    puts "Running..."

    main     = Thread.main       # The main thread
    current  = Thread.current    # The current thread
    all      = Thread.list       # All threads still running
    # Now call join on each thread
    all.each{|t| t.join unless t == current or t == main }
=end
  end
end
